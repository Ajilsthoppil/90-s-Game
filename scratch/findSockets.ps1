Add-Type -AssemblyName System.Drawing
$imgPath = "C:\Users\abist\Doztix\90's Game\assets\games\ludo\anime_board.jpg"
$bmp = [System.Drawing.Bitmap]::FromFile($imgPath)

# Let's inspect Red Yard (X: 190..448, Y: 70..328)
# Look for the 4 red circles in Luffy's tray (around Y=200..280, X=220..380)
Write-Output "Finding Luffy's 4 sockets:"
for ($y = 190; $y -le 280; $y += 10) {
    for ($x = 200; $x -le 400; $x += 20) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.R -gt 200 -and $p.G -lt 60 -and $p.B -lt 60) {
            Write-Output "Red socket area: X=$x, Y=$y (R=$($p.R) G=$($p.G) B=$($p.B))"
        }
    }
}

$bmp.Dispose()
