## Быстрый перезапуск (Windows / PowerShell)

### Самый простой способ после изменений

В корне репозитория:

```bash
npm run dev:clean
```

Эта команда:
- освобождает **3000** и **5000** (убивает только процессы, которые их слушают)
- запускает `backend` (Nest) и `frontend` (Next) вместе

### Если нужно вручную

1) Остановить текущие процессы:

- В том же окне терминала, где запущен `npm run dev`, нажми `Ctrl+C`
- Если после этого порты всё равно заняты:

```bash
npm run kill:ports
```

2) Запустить заново:

```bash
npm run dev
```

## Почему бывает `EADDRINUSE`

- **Бэкенд** слушает порт **5000**
- **Фронтенд** слушает порт **3000**

Ошибка `listen EADDRINUSE ... :5000` означает, что **предыдущий процесс не завершился** или завис, и порт остался занят.

## Полезные проверки

Проверить, кто держит порт:

```powershell
netstat -ano | Select-String ":5000"
netstat -ano | Select-String ":3000"
```

Узнать, что за процесс по PID:

```powershell
tasklist /FI "PID eq <PID>"
wmic process where "ProcessId=<PID>" get ProcessId,Name,CommandLine
```

