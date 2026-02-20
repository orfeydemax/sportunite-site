
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$Root = [System.Windows.Automation.AutomationElement]::RootElement
$ConditionTrue = [System.Windows.Automation.Condition]::TrueCondition

Write-Host "Scanning Top Level Windows..."
$Windows = $Root.FindAll([System.Windows.Automation.TreeScope]::Children, $ConditionTrue)

foreach ($Win in $Windows) {
    if ($Win.Current.Name -match "Chrome") {
        Write-Host "Found Chrome Window: $($Win.Current.Name)"
        try {
            # Limit depth or count to avoid freeze
            $Elements = $Win.FindAll([System.Windows.Automation.TreeScope]::Descendants, $ConditionTrue)
            Write-Host "Found $($Elements.Count) elements. Top 50 names:"
            
            $Count = 0
            foreach ($El in $Elements) {
                $Name = $El.Current.Name
                if (-not [string]::IsNullOrWhiteSpace($Name)) {
                    Write-Host " - '$Name'"
                    $Count++
                    if ($Count -ge 50) { break }
                }
            }
        }
        catch {
            Write-Warning "Error scanning window: $_"
        }
    }
}
