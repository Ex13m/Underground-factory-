# Hooks — механические гарантии (guarantee → hook)

`guard-delete.ps1` — PreToolUse-hook: блокирует рекурсивные удаления
(`rm -rf`, `Remove-Item -Recurse`, `rd /s`) по путям вне `C:/dev_old`.

**Статус: написан, НЕ подключён.** Подключение в `settings.json` (секция
`hooks`) — отдельным шагом после теста на компе A, потому что hook зовёт
`powershell`, которого нет в облачных Linux-сессиях: там он давал бы шумные
ошибки в каждом репо после kairos-sync. До подключения механическую защиту
несут permissions.deny в `.claude/settings.json` (работают везде).

Подключение (когда протестируем):
```json
"hooks": {
  "PreToolUse": [{
    "matcher": "Bash|PowerShell",
    "hooks": [{"type": "command", "command": "powershell -NoProfile -File .claude/hooks/guard-delete.ps1"}]
  }]
}
```
