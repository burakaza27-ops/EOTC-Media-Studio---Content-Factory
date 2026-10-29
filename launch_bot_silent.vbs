Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "d:\EOTC Media Studio - Content Factory\eotc-media-studio"
WshShell.Run "cmd.exe /c """ & "d:\EOTC Media Studio - Content Factory\eotc-media-studio\run_bot_forever.bat" & """", 0, False
