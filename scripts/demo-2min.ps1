$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root

function Wait-Url {
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [int]$TimeoutSeconds = 120
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
            if ($response.StatusCode -eq 200) {
                return
            }
        }
        catch {
        }
        Start-Sleep -Seconds 2
    }
    throw "Timeout while waiting for $Url"
}

Wait-Url -Url 'http://localhost:18080/actuator/health'
Wait-Url -Url 'http://localhost:5678/healthz'
Wait-Url -Url 'http://localhost:3000/login'

node scripts/e2e-demo.mjs
if ($LASTEXITCODE -ne 0) {
    throw 'E2E scenario failed'
}

Write-Host 'DEMO_SUCCESS — Groq réel utilisé, aucun mock, aucun email réel.'
