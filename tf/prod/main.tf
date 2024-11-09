terraform {
  required_version = ">= 1.0"

  backend "s3" {
    bucket = "property-praxis-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

locals {
  domain          = "propertypraxis.org"
  name            = "property-praxis"
  appname         = "propertypraxis"
  env             = "prod"
  state_bucket    = "property-praxis-terraform-state"
  github_subjects = ["PropertyPraxis/property-praxis:*"]
  vpc_cidr        = "10.0.0.0/16"
  azs             = slice(data.aws_availability_zones.available.names, 0, 3)
  container_port  = 5000

  tags = {
    project     = local.name
    environment = local.env
  }
}

data "aws_availability_zones" "available" {}

data "aws_ssm_parameter" "db_username" {
  name = "/${local.name}/${local.env}/db_username"
}

data "aws_ssm_parameter" "db_password" {
  name = "/${local.name}/${local.env}/db_password"
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${local.name}-${local.env}"
  cidr = local.vpc_cidr

  azs              = local.azs
  public_subnets   = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k)]
  private_subnets  = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k + 3)]
  database_subnets = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k + 6)]

  map_public_ip_on_launch = true

  create_database_subnet_group           = true
  create_database_subnet_route_table     = true
  create_database_internet_gateway_route = true

  tags = local.tags
}

module "security_group" {
  source  = "terraform-aws-modules/security-group/aws//modules/postgresql"
  version = "~> 5.0"

  name                = "${local.name}-${local.env}"
  vpc_id              = module.vpc.vpc_id
  ingress_cidr_blocks = ["0.0.0.0/0"]

  tags = local.tags
}

data "aws_iam_policy_document" "s3_public" {
  statement {
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions   = ["s3:GetObject"]
    resources = ["${module.s3.s3_bucket_arn}/*"]
  }
}

module "s3" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "3.15.1"

  bucket        = "${local.name}-${local.env}-assets"
  acl           = "public-read"
  attach_policy = true
  policy        = data.aws_iam_policy_document.s3_public.json

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false

  control_object_ownership = true
  object_ownership         = "BucketOwnerPreferred"

  website = {
    index_document = "index.html"
    error_document = "index.html"
  }

  cors_rule = [
    {
      allowed_methods = ["HEAD", "GET"]
      allowed_headers = ["*"]
      allowed_origins = ["*"]
      max_age_seconds = 3600
    }
  ]
}

data "aws_route53_zone" "domain" {
  name = local.domain
}

resource "aws_route53_record" "site" {
  zone_id = data.aws_route53_zone.domain.zone_id
  name    = local.domain
  type    = "A"

  alias {
    name    = module.cloudfront.cloudfront_distribution_domain_name
    zone_id = module.cloudfront.cloudfront_distribution_hosted_zone_id

    evaluate_target_health = false
  }
}

resource "aws_route53_record" "site_www" {
  zone_id = data.aws_route53_zone.domain.zone_id
  name    = "www.${local.domain}"
  type    = "A"

  alias {
    name    = module.cloudfront.cloudfront_distribution_domain_name
    zone_id = module.cloudfront.cloudfront_distribution_hosted_zone_id

    evaluate_target_health = false
  }
}

module "acm" {
  source  = "terraform-aws-modules/acm/aws"
  version = "~> 4.0"

  domain_name = local.domain
  zone_id     = data.aws_route53_zone.domain.zone_id

  validation_method = "DNS"

  subject_alternative_names = [
    "*.${local.domain}"
  ]

  wait_for_validation = true

  tags = local.tags
}

module "cloudfront" {
  source  = "terraform-aws-modules/cloudfront/aws"
  version = "3.2.1"

  aliases = [local.domain, "www.${local.domain}"]

  enabled             = true
  is_ipv6_enabled     = true
  price_class         = "PriceClass_100"
  retain_on_delete    = false
  wait_for_deployment = true

  origin = {
    app = {
      domain_name = "${module.s3.s3_bucket_id}.s3-website-${data.aws_region.current.name}.amazonaws.com"
      custom_origin_config = {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "http-only"
        origin_ssl_protocols   = ["TLSv1", "TLSv1.1", "TLSv1.2"]
      }
    }
    api = {
      domain_name = module.alb.dns_name
      custom_origin_config = {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "http-only"
        origin_ssl_protocols   = ["TLSv1", "TLSv1.1", "TLSv1.2"]
      }
    }
  }

  default_cache_behavior = {
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "app"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    query_string           = true
  }

  ordered_cache_behavior = [
    {
      path_pattern           = "/api/*"
      target_origin_id       = "api"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
      cached_methods         = ["GET", "HEAD"]
      compress               = true
      query_string           = true
    }
  ]

  viewer_certificate = {
    acm_certificate_arn = module.acm.acm_certificate_arn
    ssl_support_method  = "sni-only"
  }
}

# Use for both environments
module "ecr" {
  source  = "terraform-aws-modules/ecr/aws"
  version = "1.6.0"

  repository_name = "${local.name}-${local.env}"
  repository_type = "private"

  repository_read_write_access_arns = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
  repository_lifecycle_policy = jsonencode({
    rules = [
      {
        rulePriority = 1,
        description  = "Keep last 5 images",
        selection = {
          tagStatus   = "any",
          countType   = "imageCountMoreThan",
          countNumber = 5
        },
        action = {
          type = "expire"
        }
      }
    ]
  })

  tags = local.tags
}

module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "6.1.1"

  identifier = "${local.name}-${local.env}"

  engine               = "postgres"
  engine_version       = "14"
  family               = "postgres14"
  major_engine_version = "14"
  instance_class       = "db.t4g.small"

  allocated_storage     = 20
  max_allocated_storage = 50

  db_name  = local.appname
  port     = 5432
  username = data.aws_ssm_parameter.db_username.value
  password = data.aws_ssm_parameter.db_password.value

  manage_master_user_password = false

  multi_az               = false
  db_subnet_group_name   = module.vpc.database_subnet_group
  vpc_security_group_ids = [module.security_group.security_group_id]
  publicly_accessible    = true
  ca_cert_identifier     = "rds-ca-rsa4096-g1"

  maintenance_window              = "Mon:00:00-Mon:03:00"
  backup_window                   = "03:00-06:00"
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  create_cloudwatch_log_group     = true

  backup_retention_period = 1
  skip_final_snapshot     = true
  deletion_protection     = false

  performance_insights_enabled = false
  create_monitoring_role       = true
  monitoring_interval          = 60

  apply_immediately = true

  parameters = [
    {
      name  = "autovacuum"
      value = 1
    },
    {
      name  = "client_encoding"
      value = "utf8"
    }
  ]

  monitoring_role_name            = "${local.name}-rds-monitor"
  monitoring_role_use_name_prefix = true
}

module "alb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "9.2.0"

  name    = "${local.name}-${local.env}-alb"
  vpc_id  = module.vpc.vpc_id
  subnets = module.vpc.public_subnets

  security_group_ingress_rules = {
    all_http = {
      from_port   = 80
      to_port     = 80
      ip_protocol = "tcp"
      description = "HTTP web traffic"
      cidr_ipv4   = "0.0.0.0/0"
    }
    all_https = {
      from_port   = 443
      to_port     = 443
      ip_protocol = "tcp"
      description = "HTTPS web traffic"
      cidr_ipv4   = "0.0.0.0/0"
    }
  }
  security_group_egress_rules = {
    all = {
      ip_protocol = "-1"
      cidr_ipv4   = module.vpc.vpc_cidr_block
    }
  }

  listeners = {
    http-https-redirect = {
      port     = 80
      protocol = "HTTP"
      forward = {
        target_group_key = "app"
      }
      # redirect = {
      #   port        = "443"
      #   protocol    = "HTTPS"
      #   status_code = "HTTP_301"
      # }
    }
    # https = {
    #   port     = 443
    #   protocol = "HTTPS"
    #   # certificate_arn = "arn:aws:iam::123456789012:server-certificate/test_cert-123456789012"

    #   forward = {
    #     target_group_key = "app"
    #   }
    # }
  }

  target_groups = {
    app = {
      name_prefix = "app"
      protocol    = "HTTP"
      port        = local.container_port
      target_type = "ip"

      health_check = {
        enabled             = true
        healthy_threshold   = 5
        interval            = 30
        matcher             = "200"
        path                = "/api/health"
        port                = "traffic-port"
        protocol            = "HTTP"
        timeout             = 5
        unhealthy_threshold = 2
      }

      create_attachment = false
    }
  }

  tags = local.tags
}

module "ecs_cluster" {
  source  = "terraform-aws-modules/ecs/aws//modules/cluster"
  version = "5.7.4"

  cluster_name = "${local.name}-${local.env}"

  fargate_capacity_providers = {
    FARGATE = {
      default_capacity_provider_strategy = {
        weight = 50
      }
    }
    FARGATE_SPOT = {
      default_capacity_provider_strategy = {
        weight = 50
      }
    }
  }

  cluster_settings = {
    name  = "containerInsights"
    value = "disabled"
  }
}

data "aws_ssm_parameter" "mapbox_token" {
  name = "/${local.name}/${local.env}/mapbox_access_token"
}

module "ecs_service" {
  source  = "terraform-aws-modules/ecs/aws//modules/service"
  version = "5.7.4"

  name        = local.name
  cluster_arn = module.ecs_cluster.arn

  cpu    = 256
  memory = 512

  enable_execute_command = true

  container_definitions = {
    praxis = {
      cpu       = 256
      memory    = 512
      essential = true
      image     = "${module.ecr.repository_url}:${var.ecs_image_tag}"
      port_mappings = [
        {
          name          = "praxis"
          host_port     = local.container_port
          containerPort = local.container_port
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "ENVIRONMENT"
          value = local.env
        },
        {
          name  = "DATABASE_HOST"
          value = module.rds.db_instance_endpoint
        },
        {
          name  = "DATABASE_NAME"
          value = local.appname
        }
      ]
      secrets = [
        {
          name      = "DATABASE_USERNAME",
          valueFrom = data.aws_ssm_parameter.db_username.arn
        },
        {
          name      = "DATABASE_PASSWORD",
          valueFrom = data.aws_ssm_parameter.db_password.arn
        },
        {
          name      = "MAPBOX_ACCESS_TOKEN",
          valueFrom = data.aws_ssm_parameter.mapbox_token.arn
        }
      ]
      readonly_root_filesystem = false
    }
  }

  load_balancer = {
    service = {
      target_group_arn = module.alb.target_groups["app"].arn
      container_name   = "praxis"
      container_port   = local.container_port
    }
  }

  subnet_ids       = module.vpc.public_subnets
  assign_public_ip = true
  security_group_rules = {
    alb_ingress = {
      type                     = "ingress"
      from_port                = local.container_port
      to_port                  = local.container_port
      protocol                 = "tcp"
      source_security_group_id = module.alb.security_group_id
    }

    egress_all = {
      type        = "egress"
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }
}
