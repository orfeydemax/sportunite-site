$src = "C:\Users\max\.gemini\antigravity\brain\2503eefa-92b4-42ef-a4d8-5f6e0bb82e14"
$dst = "D:\MVProfi\AI агентство\Разработка приложений\Сайт - спорт юнит\images"

Copy-Item "$src\media__1771346819510.jpg" "$dst\champion.jpg" -Force
Copy-Item "$src\media__1771346899129.jpg" "$dst\logo.png" -Force

Write-Output "Done"
exit
