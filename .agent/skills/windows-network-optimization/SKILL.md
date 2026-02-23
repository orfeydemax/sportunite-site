---
name: windows-network-optimization
description: Навык для оптимизации сетевых настроек Windows (TCP/IP, MTU, DNS). Используйте, когда пользователь просит "ускорить интернет", "настроить пинг", "оптимизировать MTU" или "выбрать DNS".
---

# Windows Network Optimization

Этот навык содержит инструкции и паттерны кода PowerShell для оптимизации сетевого стека Windows.

## 1. Проверка прав Администратора
Все сетевые настройки требуют прав администратора.
```powershell
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Warning "Требуются права администратора!"
    Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    Exit
}
```

## 2. Определение активного сетевого адаптера
Нужно настраивать тот адаптер, через который идет интернет.
```powershell
$adapter = Get-NetAdapter | Where-Object { $_.Status -eq 'Up' -and $_.Virtual -eq $false } | Sort-Object LinkSpeed -Descending | Select-Object -First 1
Write-Host "Обнаружен основной адаптер: $($adapter.Name)"
```

## 3. Настройка MTU (Maximum Transmission Unit)
Идеальный MTU = (Максимальный размер пакета без фрагментации) + 28 байт (IP/ICMP заголовки).
Стандарт: 1500. Для PPPoE часто 1492 или 1480.

### Алгоритм поиска:
1. Пинговать с флагом "Don't Fragment" (`ping -f -l SIZE`).
2. Найти максимум, где нет ошибки "Packet needs to be fragmented".
3. `MTU = SIZE + 28`.

### Применение:
```powershell
netsh interface ipv4 set subinterface "$($adapter.Name)" mtu=1500 store=persistent
```

## 4. Настройка TCP (TCP Optimizer)
В Windows 10/11 используйте шаблон `globocmd` или ручную настройку `netsh int tcp`.

### Рекомендуемые настройки:
```powershell
# Сброс к стандартам (безопасно)
netsh int ip reset
netsh int tcp reset

# Включение автотюнинга (важно для высоких скоростей)
netsh int tcp set global autotuninglevel=normal

# Провайдер перегрузки (CTCP устарел в Win10+, используется CUBIC по умолчанию, но можно проверить)
# Для Win Server или старых версий:
# netsh int tcp set global congestionprovider=ctcp 

# Масштабирование окна (Receive Window Auto-Tuning)
netsh int tcp set global rss=enabled
netsh int tcp set global rsc=enabled
```

## 5. Выбор и настройка DNS
Используйте `Measure-Command` или Ping для замера задержки.

### Популярные DNS:
- **Google**: 8.8.8.8, 8.8.4.4
- **Cloudflare**: 1.1.1.1, 1.0.0.1
- **OpenDNS**: 208.67.222.222, 208.67.220.220
- **Quad9**: 9.9.9.9

### Применение:
```powershell
Set-DnsClientServerAddress -InterfaceIndex $adapter.InterfaceIndex -ServerAddresses ("1.1.1.1", "8.8.8.8")
```

## 6. Геолокация (для контекста)
Чтобы понять, какие DNS тестировать (региональные), можно узнать IP-инфо.
```powershell
$geo = Invoke-RestMethod -Uri "http://ip-api.com/json"
Write-Host "Ваша локация: $($geo.country), $($geo.city)"
```
