param (
    [string]$Path = $PWD,
    [string]$OutFile = "report.html"
)

# Configuration
$LimitFilesPerCategory = 50

# Categories Definition
$Categories = @{
    "Images"    = @(".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp", ".ico", ".tif", ".tiff", ".psd")
    "GoPro"     = @(".360", ".lrv", ".thm")
    "Video"     = @(".mp4", ".mov", ".avi", ".mkv", ".wmv", ".flv", ".webm")
    "Audio"     = @(".mp3", ".wav", ".flac", ".aac", ".ogg", ".wma")
    "E-Books"   = @(".fb2", ".epub", ".mobi", ".djvu", ".azw", ".azw3", ".cbr", ".cbz")
    "Documents" = @(".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".rtf", ".md", ".csv")
    "Code"      = @(".html", ".css", ".js", ".ts", ".py", ".java", ".c", ".cpp", ".cs", ".php", ".json", ".xml", ".yml", ".yaml", ".sql", ".sh", ".bat", ".ps1")
    "Archives"  = @(".zip", ".rar", ".7z", ".tar", ".gz")
    "System"    = @(".exe", ".dll", ".sys", ".msi", ".iso", ".bin", ".dat", ".log", ".tmp")
}

# Invert Map for faster lookup
$CategoryMap = @{}
$Categories.GetEnumerator() | ForEach-Object {
    $Cat = $_.Key
    $_.Value | ForEach-Object { $CategoryMap[$_] = $Cat }
}

# Initialize Stats
$Stats = @{}
$Categories.Keys | ForEach-Object {
    $Stats[$_] = @{ 
        Count     = 0; 
        SizeBytes = 0;
        TopFiles  = [System.Collections.Generic.List[Object]]::new() 
    }
}
$Stats["Other"] = @{ 
    Count     = 0; 
    SizeBytes = 0;
    TopFiles  = [System.Collections.Generic.List[Object]]::new()
}

$TotalFiles = 0
$TotalSize = 0

Write-Host "Starting scan for: $Path"

# Scan
Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
    $Ext = $_.Extension.ToLower()
    $Size = $_.Length
    
    $Cat = $CategoryMap[$Ext]
    if (-not $Cat) { $Cat = "Other" }
    
    $Stats[$Cat].Count++
    $Stats[$Cat].SizeBytes += $Size
    
    # Store file info for sorting later
    # We store ALL files initially, but this might be memory intensive for millions of files.
    # Optimization: Only keep if it's potentially in top 50? No, we don't know the threshold yet.
    # Lightweight object.
    $Stats[$Cat].TopFiles.Add(@{ Name = $_.Name; Path = $_.FullName; Size = $Size })
    
    $TotalFiles++
    $TotalSize += $Size
    
    if ($TotalFiles % 1000 -eq 0) {
        Write-Progress -Activity "Scanning Files" -Status "$TotalFiles processed..."
    }
}
Write-Progress -Activity "Scanning Files" -Completed

# Post-process: Sort and Limit Top Files
Write-Host "Processing stats..."
$Stats.Keys | ForEach-Object {
    $Key = $_
    $List = $Stats[$Key].TopFiles
    # Sort descending by Size and take top N
    $Sorted = @($List | Sort-Object -Property Size -Descending | Select-Object -First $LimitFilesPerCategory)
    $Stats[$Key].TopFiles = $Sorted
}

# Prepare JSON Data
$Data = @{
    path       = $Path
    categories = $Stats
}
$JsonData = $Data | ConvertTo-Json -Depth 4 -Compress

# Read Template
$ScriptPath = $PSScriptRoot
$TemplatePath = Join-Path $ScriptPath "..\assets\dashboard.html"

if (-not (Test-Path $TemplatePath)) {
    Write-Error "Template file not found at: $TemplatePath"
    exit 1
}
$HtmlContent = Get-Content $TemplatePath -Raw -Encoding UTF8

# Format Total Size
function Format-Bytes {
    param($Bytes)
    if ($Bytes -lt 1KB) { return "$Bytes Bytes" }
    if ($Bytes -lt 1MB) { return "{0:N2} KB" -f ($Bytes / 1KB) }
    if ($Bytes -lt 1GB) { return "{0:N2} MB" -f ($Bytes / 1MB) }
    return "{0:N2} GB" -f ($Bytes / 1GB)
}
$TotalSizeStr = Format-Bytes $TotalSize

# Replace Placeholders
$HtmlContent = $HtmlContent.Replace("{{PATH}}", $Path.ToString().Replace("\", "\\"))
$HtmlContent = $HtmlContent.Replace("{{TOTAL_SIZE}}", $TotalSizeStr)
$HtmlContent = $HtmlContent.Replace("/*{{DATA_JSON}}*/ { categories: {} }", $JsonData)
$HtmlContent = $HtmlContent.Replace("{{DATE}}", (Get-Date).ToString("yyyy-MM-dd HH:mm"))

# Save Report
$OutPath = Join-Path $PWD $OutFile
$HtmlContent | Set-Content $OutPath -Encoding UTF8

Write-Host "Report created: $OutPath"
Start-Process $OutPath
