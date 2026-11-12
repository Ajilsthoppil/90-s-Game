Add-Type -AssemblyName System.Drawing
$imgPath = "C:\Users\abist\Doztix\90's Game\assets\games\ludo\anime_board.jpg"
$bmp = [System.Drawing.Bitmap]::FromFile($imgPath)

Write-Output "Image width: $($bmp.Width), height: $($bmp.Height)"

# Check corners of the wooden board dock:
# Look for the outer wooden rope railings of the 4 corner bases:
# Red base: Top-Left (where is the red circular base border?)
# Green base: Top-Right
# Yellow base: Bottom-Left
# Blue base: Bottom-Right

# Let's inspect where Luffy's red circular tray starts on the left:
for ($x = 100; $x -le 250; $x += 10) {
    $p = $bmp.GetPixel($x, 150)
    Write-Output "Y=150 X=$x : R=$($p.R) G=$($p.G) B=$($p.B)"
}

$bmp.Dispose()
