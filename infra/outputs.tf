output "site_url" {
  description = "アプリの URL (CloudFront 経由・HTTPS)"
  value       = "https://${aws_cloudfront_distribution.this.domain_name}"
}

output "api_url" {
  description = "API のベース URL"
  value       = local.api_url
}

output "alb_dns" {
  description = "ALB の直接 DNS (HTTP・デバッグ用)"
  value       = "http://${aws_lb.this.dns_name}"
}

output "cluster_name" {
  value = aws_ecs_cluster.this.name
}

output "ecr_backend" {
  value = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend" {
  value = aws_ecr_repository.frontend.repository_url
}

output "region" {
  value = var.region
}

output "media_bucket" {
  value = aws_s3_bucket.media.bucket
}

output "db_endpoint" {
  value = aws_db_instance.this.address
}

output "db_password" {
  value     = random_password.db.result
  sensitive = true
}
