# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.
[CmdletBinding()]
Param(
    [Parameter()]
    [Alias('k')]
    [string]$keyvault
)

$global:keyvault = $keyvault
$global:NODE_VERSION = "12.20.2"

function exitWithUsageInfo {
    Write-Output "Usage: pool-startup.ps1 -k <key vault name>"
    exit 1
}

function installBootstrapPackages() {
    Write-Output "Installing az cli"
    Invoke-WebRequest -Uri https://aka.ms/installazurecliwindows -OutFile .\AzureCLI.msi; Start-Process msiexec.exe -Wait -ArgumentList '/I AzureCLI.msi /quiet'; rm .\AzureCLI.msi
    az upgrade
}

function installBrowserHostServiceDependencies() {
    $nodeInstallDir = "C:\nodejs"
    $env:PATH = "$env:PATH;$nodeInstallDir"

    if (Test-Path -Path $nodeInstallDir) {
        Write-Output "Directory $nodeInstallDir already exists, skipping node install"
    }
    else {
        Write-Output "Installing node"
        Invoke-WebRequest "https://nodejs.org/dist/v$global:NODE_VERSION/node-v$global:NODE_VERSION-win-x64.zip" -OutFile 'node.zip' -UseBasicParsing
        Expand-Archive node.zip -DestinationPath C:\
        Rename-Item -Path "C:\node-v$global:NODE_VERSION-win-x64" -NewName $nodeInstallDir
    }

    $current = pwd
    rm -r -Force \service-wd
    mkdir \service-wd
    cp host-browser-service.js \service-wd\
    cp windows-service.js \service-wd\
    cd \service-wd
    npm install puppeteer@5.5.0 #TODO: create and upload a package.json to get the right version automatically
    npm install -g node-windows
    npm link node-windows
    node windows-service.js
    cd $current
}

if ([string]::IsNullOrEmpty($global:keyvault)) {
    $global:keyvault = $env:KEY_VAULT_NAME;
}

if ([string]::IsNullOrEmpty($global:keyvault)) {
    exitWithUsageInfo
}

installBootstrapPackages
installBrowserHostServiceDependencies

./pull-image-from-container-registry.ps1 -k $global:keyvault

Write-Output "Invoking custom pool startup script"
./custom-pool-post-startup.ps1

Write-Output "Successfully completed pool startup script execution"

Write-Output "Printing process and netstat info"

Get-Process

netstat -nba
