Add-Type -AssemblyName System.Drawing
$imgPath = "C:\Users\abist\Doztix\90's Game\assets\games\ludo\anime_board.jpg"
$bmp = [System.Drawing.Bitmap]::FromFile($imgPath)

Write-Output "Scanning horizontal line at Y=416:"
for ($x = 80; $x -le 960; $x += 15) {
    $p = $bmp.GetPixel($x, 416)
    Write-Output "X=$x : R=$($p.R) G=$($p.G) B=$($p.B)"
}

$bmp.Dispose()
