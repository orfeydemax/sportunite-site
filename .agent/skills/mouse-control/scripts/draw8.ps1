param(
    [int]$Loops = 3,
    [int]$Speed = 5,
    [int]$Radius = 150
)

# Load required assemblies
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Get screen center
$Screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$CenterX = $Screen.Width / 2
$CenterY = $Screen.Height / 2

Write-Host "Drawing Figure 8..."
Write-Host "Center: $CenterX, $CenterY"
Write-Host "Radius: $Radius"
Write-Host "Loops: $Loops"

# Draw Loop
for ($l = 0; $l -lt $Loops; $l++) {
    # 0 to 360 degrees
    # Step size 2 degrees for smoothness
    for ($angle = 0; $angle -lt 360; $angle += 2) {
        $rad = $angle * [Math]::PI / 180
        
        # Parametric equation for Figure 8 (Infinity symbol/Lemniscate)
        # X = a * cos(t) / (1 + sin^2(t))
        # Y = a * sin(t) * cos(t) / (1 + sin^2(t))
        
        # Scaling factor
        $scale = $Radius * 1.5 

        $denom = 1 + [Math]::Pow([Math]::Sin($rad), 2)
        
        $x_offset = ($scale * [Math]::Cos($rad)) / $denom
        $y_offset = ($scale * [Math]::Sin($rad) * [Math]::Cos($rad)) / $denom
        
        $X = $CenterX + $x_offset
        $Y = $CenterY - $y_offset # Invert Y because screen coords go down
        
        [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point([int]$X, [int]$Y)
        
        Start-Sleep -Milliseconds $Speed
    }
}

Write-Host "Finished."
