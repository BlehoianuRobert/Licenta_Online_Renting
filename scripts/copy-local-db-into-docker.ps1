<#
.SYNOPSIS
  Copiază baza online_rental_db din MySQL-ul tău de pe PC (ex. port 3306) în MySQL din Docker (container online-rental-mysql).

.DESCRIPTION
  După rulare, utilizatorii și parolele din baza LOCALĂ vor funcționa în aplicația care rulează în Docker.
  Repornește backend-ul: docker compose restart backend

.EXAMPLE
  # Ești DEJA în PowerShell (nu rula iar comanda "powershell"):
  cd "C:\Users\...\licenta - Copy"
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
  .\scripts\copy-local-db-into-docker.ps1 -SourcePassword "parola_ta_mysql_local"

.EXAMPLE
  Alt port / utilizator:
  .\scripts\copy-local-db-into-docker.ps1 -SourceHost 127.0.0.1 -SourcePort 3306 -SourceUser root -SourcePassword "xxx"
#>
param(
    [string] $SourceHost = "127.0.0.1",
    [int] $SourcePort = 3306,
    [string] $SourceUser = "root",
    [Parameter(Mandatory = $false)]
    [string] $SourcePassword = "",
    [string] $SourceDatabase = "online_rental_db",
    [string] $DockerContainer = "online-rental-mysql",
    [string] $DockerUser = "root",
    [string] $DockerPassword = "12345"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($SourcePassword)) {
    $secure = Read-Host "Parola pentru MySQL LOCAL ($SourceUser@$SourceHost`:$SourcePort)" -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        $SourcePassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
}

$docker = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
if (-not (Test-Path $docker)) { $docker = "docker" }

$inspect = & $docker inspect -f "{{.State.Running}}" $DockerContainer 2>$null
if ($inspect -ne "true") {
    Write-Error "Containerul '$DockerContainer' nu rulează. Pornește stack-ul: docker compose up -d"
}

$candidates = @(
    "mysqldump",
    "${env:ProgramFiles}\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
    "${env:ProgramFiles}\MySQL\MySQL Server 8.4\bin\mysqldump.exe",
    "C:\xampp\mysql\bin\mysqldump.exe",
    "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysqldump.exe"
)

$mysqldump = $null
foreach ($c in $candidates) {
    if ($c -eq "mysqldump") {
        $cmd = Get-Command mysqldump -ErrorAction SilentlyContinue
        if ($cmd) { $mysqldump = $cmd.Source; break }
    } elseif (Test-Path -LiteralPath $c) {
        $mysqldump = $c
        break
    }
}

if (-not $mysqldump) {
    Write-Error "mysqldump nu a fost găsit. Instalează MySQL Client sau adaugă bin-ul MySQL la PATH. Sau exportă manual: mysqldump ... > backup.sql apoi .\scripts\import-mysql-to-docker.ps1 -DumpFile backup.sql"
}

Write-Host ""
Write-Host "=== Copiere $SourceDatabase din $SourceHost`:$SourcePort -> Docker ($DockerContainer) ===" -ForegroundColor Cyan
Write-Host "Atenție: tabelele existente în Docker pentru această bază vor fi înlocuite (DROP din dump)." -ForegroundColor Yellow
Write-Host ""

$sqlPath = Join-Path (Get-Location) "temp_docker_import.sql"
$errPath = Join-Path (Get-Location) "temp_docker_import_err.txt"
Remove-Item $sqlPath, $errPath -Force -ErrorAction SilentlyContinue

# Fără parolă în linia de comandă (evită warning + probleme cu caractere speciale în parolă)
$dumpArgs = @(
    "-h", $SourceHost,
    "-P", "$SourcePort",
    "-u", $SourceUser,
    "--single-transaction",
    "--routines",
    "--triggers",
    "--column-statistics=0",
    "--set-gtid-purged=OFF",
    $SourceDatabase
)

function Quote-CmdToken([string]$s) {
    if ([string]::IsNullOrEmpty($s)) { return '""' }
    if ($s -match '[\s"]') { '"' + ($s -replace '"', '""') + '"' } else { $s }
}

$env:MYSQL_PWD = $SourcePassword
try {
    # cmd.exe + redirecții: LASTEXITCODE corect; MYSQL_PWD evită --password= în linia de comandă
    $exePart = Quote-CmdToken $mysqldump
    $argsPart = ($dumpArgs | ForEach-Object { Quote-CmdToken $_ }) -join ' '
    $cmdLine = "$exePart $argsPart > $(Quote-CmdToken $sqlPath) 2> $(Quote-CmdToken $errPath)"
    cmd.exe /c $cmdLine
    $dumpExit = $LASTEXITCODE
} finally {
    Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
}

$errText = Get-Content $errPath -Raw -ErrorAction SilentlyContinue
if ($dumpExit -ne 0) {
    Remove-Item $sqlPath, $errPath -Force -ErrorAction SilentlyContinue
    Write-Error "mysqldump a eșuat (cod $dumpExit). Verifică host/port/parolă și că baza '$SourceDatabase' există local.`nStderr:`n$errText"
}

# Doar avertismente pe stderr (ex. password warning) = OK dacă fișierul SQL e nenul
if (-not (Test-Path $sqlPath) -or ((Get-Item $sqlPath).Length -lt 50)) {
    Remove-Item $sqlPath, $errPath -Force -ErrorAction SilentlyContinue
    Write-Error "Dump gol sau lipsă. Stderr:`n$errText"
}

$size = (Get-Item $sqlPath).Length
if ($size -lt 500) {
    Write-Warning "Dump-ul este foarte mic ($size bytes). Baza locală poate fi goală sau numele bazei e greșit."
}

Write-Host "Dump OK ($size bytes). Import în Docker..."
# Folosește șiruri între ghilimele — altfel PowerShell poate trimite literal „-u$DockerUser” către mysql din container
Get-Content -LiteralPath $sqlPath -Raw -Encoding UTF8 | & $docker exec -i $DockerContainer mysql `
    "-u${DockerUser}" `
    "-p${DockerPassword}" `
    $SourceDatabase
$importCode = $LASTEXITCODE
Remove-Item $sqlPath, $errPath -Force -ErrorAction SilentlyContinue

if ($importCode -ne 0) {
    Write-Error "Import în Docker a eșuat (cod $importCode)."
}

Write-Host ""
Write-Host "Import reușit. Rulează:" -ForegroundColor Green
Write-Host "  docker compose restart backend" -ForegroundColor White
Write-Host "Apoi autentificare pe http://localhost:3000 cu același user/parolă ca în baza ta locală." -ForegroundColor White
Write-Host ""
Write-Host "Dacă tot nu merge login: în Workbench pe port 3307 verifică users.is_verified = 1 pentru contul tău." -ForegroundColor DarkGray
