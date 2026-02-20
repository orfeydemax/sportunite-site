param()

# Load Assemblies
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# P/Invoke for Mouse Click
$signature = @"
[DllImport("user32.dll",CharSet=CharSet.Auto, CallingConvention=CallingConvention.StdCall)]
public static extern void mouse_event(long dwFlags, long dx, long dy, long cButtons, long dwExtraInfo);
"@
$mouse = Add-Type -MemberDefinition $signature -Name "Win32MouseEvent" -Namespace Win32Functions -PassThru

# Mouse Event Constants
$MOUSEEVENTF_LEFTDOWN = 0x00000002
$MOUSEEVENTF_LEFTUP = 0x00000004

# Calculate Target (Minimize Button typical location for Maximized Window)
# Windows 10/11: ~ width - 115px (3rd button from right), y ~ 15px
$Screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$TargetX = $Screen.Width - 110 
$TargetY = 15

Write-Host "Targeting Minimize Button at: $TargetX, $TargetY"

# Get Current Position
$Current = [System.Windows.Forms.Cursor]::Position

# Smooth Move Animation (so user sees intent)
$Steps = 40
for ($i = 0; $i -le $Steps; $i++) {
    $t = $i / $Steps
    # Linear interpolation
    $X = $Current.X + ($TargetX - $Current.X) * $t
    $Y = $Current.Y + ($TargetY - $Current.Y) * $t
    
    [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point([int]$X, [int]$Y)
    Start-Sleep -Milliseconds 10
}

# Ensure final position
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point([int]$TargetX, [int]$TargetY)
Start-Sleep -Milliseconds 300 # Wait for hover effect

# Click
Write-Host "Clicking..."
$mouse::mouse_event($MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
Start-Sleep -Milliseconds 50
$mouse::mouse_event($MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)

Write-Host "Done."
