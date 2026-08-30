data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

resource "random_password" "db" {
  length  = 24
  special = false
}

# Laravel の APP_KEY (base64:<32バイト>)
resource "random_id" "app_key" {
  byte_length = 32
}

locals {
  name    = var.project
  app_key = "base64:${random_id.app_key.b64_std}"

  media_url = "https://${aws_s3_bucket.media.bucket_regional_domain_name}"
  api_url   = "https://${aws_cloudfront_distribution.this.domain_name}/api"
}
