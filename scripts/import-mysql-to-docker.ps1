<#
.SYNOPSIS
  Import your local MySQL dump into the Docker MySQL used by docker-compose (root compose).

.EXAMPLE
  # From local MySQL on port 3306 (adjust user/password/db):
  mysqldump -u root -p --databases online_rental_db --single-transaction --routines > backup.sql
  .\scripts\import-mysql-to-docker.ps1 -DumpFile .\backup.sql

.EXAMPLE
  # Pipe directly (no dump file):
  mysqldump -u root -p12345 --databases online_rental_db --single-transaction | docker exec -i online-rental-mysql mysql -uroot -p12345

.NOTES
  Container name: online-rental-mysql (see docker-compose.yml).
  Host port for Workbench: 3307, password 12345 (default in compose).
#>
param(
    [Parameter(Mandatory = $true)]
    [string] $DumpFile,
    [string] $ContainerName = "online-rental-mysql",
    [string] $MysqlUser = "root",
    [string] $MysqlPassword = "12345"
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path -LiteralPath $DumpFile)) {
    Write-Error "Fișierul nu există: $DumpFile"
}

$docker = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
if (-not (Test-Path $docker)) { $docker = "docker" }

Write-Host "Import în containerul $ContainerName ... (poate dura câteva minute)"
Get-Content -LiteralPath $DumpFile -Raw -Encoding UTF8 | & $docker exec -i $ContainerName mysql `
    "-u${MysqlUser}" `
    "-p${MysqlPassword}"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Import eșuat. Verifică: Docker rulează, containerul există (docker ps), și dump-ul este valid."
}
Write-Host "Gata. Repornește backend-ul dacă e nevoie: docker compose restart backend"
