# Word COM 批量转换 doc/docx 为 txt
$root = "G:\BaiduNetdiskDownload\高情商话术"
$outDir = "F:\开发软件项目文件\对练社交\extracted_raw"

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

$files = Get-ChildItem $root -Recurse -File -Include *.doc,*.docx | Where-Object { 
  $_.Length -lt 20MB -and $_.Name -notmatch 'downloading' 
}
$success = 0
$fail = 0

foreach ($f in $files) {
  $safeName = ($f.BaseName -replace '[\\/:*?"<>|]', '_') + '.txt'
  $outPath = Join-Path $outDir $safeName
  
  if (Test-Path $outPath) { continue }
  
  try {
    # 正确的 COM SaveAs2 调用方式
    $doc = $word.Documents.OpenNoRepairDialog($f.FullName, $false, $true)
    $doc.SaveAs2([ref]$outPath, [ref]2)  # 2 = wdFormatText
    $doc.Close()
    $success++
    Write-Host "OK: $($f.BaseName) ($success/$($files.Count))"
  } catch {
    Write-Host "FAIL: $($f.Name)"
    $fail++
  }
}

$word.Quit()
Write-Host "`n=== DONE: success=$success fail=$fail ==="
Write-Host "Extracted dir size: $([math]::Round((Get-ChildItem $outDir -Filter *.txt | Measure-Object Length -Sum).Sum/1MB,2)) MB"
