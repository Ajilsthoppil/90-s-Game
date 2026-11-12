Add-Type -AssemblyName System.Drawing
$imgPath = "C:\Users\abist\Doztix\90's Game\assets\games\ludo\anime_board.jpg"
$bmp = [System.Drawing.Bitmap]::FromFile($imgPath)

# Board bounds: X from 190 to 835 (width 645, 15 cells, 43 px/cell)
# Board bounds: Y from 70 to 715 (height 645, 15 cells, 43 px/cell)
# Function to convert image pixel (x, y) to (row, col) in 15x15 grid:
function ToGrid($x, $y) {
    $c = ($x - 190) / 43.0
    $r = ($y - 70) / 43.0
    return [PSCustomObject]@{ R = [Math]::Round($r, 2); C = [Math]::Round($c, 2) }
}

Write-Output "Luffy (Top-Left) Red Sockets:"
# Looking at the image, Luffy's 4 sockets are in rows 4..5, cols 1..5:
# Socket 1 (far left): X~225, Y~215
# Socket 2 (mid left): X~270, Y~215
# Socket 3 (mid right): X~320, Y~215
# Socket 4 (far right): X~365, Y~245 (or curved down)
$s1 = ToGrid 225 215
$s2 = ToGrid 275 210
$s3 = ToGrid 325 210
$s4 = ToGrid 375 240
Write-Output "Luffy sockets: ($($s1.R), $($s1.C)), ($($s2.R), $($s2.C)), ($($s3.R), $($s3.C)), ($($s4.R), $($s4.C))"

$bmp.Dispose()
