# KAIROS guard: блокирует рекурсивные удаления вне C:/dev_old (PreToolUse hook)
# exit 2 = заблокировать вызов инструмента; stderr уходит агенту как объяснение.
$inp = [Console]::In.ReadToEnd() | ConvertFrom-Json
$cmd = $inp.tool_input.command
if (-not $cmd) { exit 0 }
$dangerous = ($cmd -match 'rm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)\b') -or
             ($cmd -match 'Remove-Item[^|;]*-Recurse') -or
             ($cmd -match '\brd\s+/s') -or
             ($cmd -match '\brmdir\s+/s')
if ($dangerous -and ($cmd -notmatch 'dev_old')) {
  [Console]::Error.WriteLine('KAIROS guard: рекурсивное удаление вне C:/dev_old заблокировано. Порядок: показать -> OK директора -> перенос в C:/dev_old -> удаление после проверки.')
  exit 2
}
exit 0
