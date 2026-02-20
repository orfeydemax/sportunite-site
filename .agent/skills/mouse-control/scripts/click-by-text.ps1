param(
    [string]$Name
)

Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Mouse Click Helper
$signature = @"
[DllImport("user32.dll",CharSet=CharSet.Auto, CallingConvention=CallingConvention.StdCall)]
public static extern void mouse_event(long dwFlags, long dx, long dy, long cButtons, long dwExtraInfo);
"@
if (-not ([System.Management.Automation.PSTypeName]'Win32Functions').Type) {
    Add-Type -MemberDefinition $signature -Name "Win32MouseEvent" -Namespace Win32Functions
}
$MOUSEEVENTF_LEFTDOWN = 0x00000002
$MOUSEEVENTF_LEFTUP = 0x00000004

Write-Host "Searching for UI element with name: '$Name'..."

# Root Element (Desktop)
$Root = [System.Windows.Automation.AutomationElement]::RootElement

# Conditions
$Condition = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, $Name)

# Find (Recursive, might be slow on full desktop)
# Optimization: Limit scope if possible. For now, try Root.
# We also try Case Insensitive search if allowed? PropertyCondition is strict.
# Let's try to find ALL and filter in PowerShell for case-insensitive.
$ConditionTrue = [System.Windows.Automation.Condition]::TrueCondition
$AllElements = $Root.FindAll([System.Windows.Automation.TreeScope]::Children, $ConditionTrue)

# Function to recursively find (simplified BFS/DFS)
# UIAutomation FindFirst is better optimized.
# Let's try FindFirst with scope Descendants usually timeouts.
# Better: Find window, then element.

# Attempt 1: Direct Search (might be slow)
# $Element = $Root.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $Condition)

# Attempt 2: Iterate Top Level Windows, then search inside
$Element = $null
$TopWindows = $Root.FindAll([System.Windows.Automation.TreeScope]::Children, $ConditionTrue)

foreach ($Win in $TopWindows) {
    # Check Window Title
    if ($Win.Current.Name -match $Name) {
        $Element = $Win
        break
    }
    
    # Search inside window
    try {
        $Found = $Win.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $Condition)
        if ($Found) {
            $Element = $Found
            break
        }
    }
    catch {
        # Ignore access denied
    }
}

if ($Element) {
    $Rect = $Element.Current.BoundingRectangle
    if ($Rect.Width -gt 0) {
        $X = $Rect.X + ($Rect.Width / 2)
        $Y = $Rect.Y + ($Rect.Height / 2)
        
        Write-Host "Found '$Name' at ($X, $Y). Clicking..."
        
        # Move Mouse
        [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point([int]$X, [int]$Y)
        Start-Sleep -Milliseconds 200
        
        # Click
        [Win32Functions.Win32MouseEvent]::mouse_event($MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
        Start-Sleep -Milliseconds 50
        [Win32Functions.Win32MouseEvent]::mouse_event($MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
        
        Write-Host "Clicked."
    }
    else {
        Write-Warning "Element found but has zero size (invisible?)."
    }
}
else {
    Write-Warning "Element '$Name' not found visible on screen."
    # Fallback could be: OCR? No.
}
