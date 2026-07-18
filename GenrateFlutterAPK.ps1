$env:JAVA_HOME="C:\Program Files\Android\openjdk\jdk-21.0.8"
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"

Push-Location "d:\Kavan\FRE WORK\Projects\SmartERP\MobileAPP\smarterp_flutter"
try {
    Write-Host "Running flutter build apk..."
    flutter build apk --release
    
    $sourceApk = "build\app\outputs\flutter-apk\app-release.apk"
    $destDir = "D:\Kavan\FRE WORK\Projects\SmartERP\UI\public"
    
    if (Test-Path $sourceApk) {
        Write-Host "Copying APK to destination..."
        if (!(Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force
        }
        Copy-Item $sourceApk -Destination (Join-Path $destDir "app-release.apk") -Force
        Write-Host "Successfully copied APK to $destDir\app-release.apk"
    } else {
        Write-Error "APK file not found at $sourceApk"
    }
} finally {
    Pop-Location
}
