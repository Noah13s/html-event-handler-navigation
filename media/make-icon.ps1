Add-Type -AssemblyName System.Drawing
$bitmap = [System.Drawing.Bitmap]::new(512, 512)
$g = [System.Drawing.Graphics]::FromImage($bitmap)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear([System.Drawing.ColorTranslator]::FromHtml('#17202B'))
$shield = [System.Drawing.Image]::FromFile((Join-Path $PWD 'media\html5-w3c.png'))
$g.DrawImage($shield, 34, 140, 195, 195)
$yellow = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#F7DF1E'))
$g.FillRectangle($yellow, 292, 150, 178, 178)
$black = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#17191C'))
$font = [System.Drawing.Font]::new('Arial', 88, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$format = [System.Drawing.StringFormat]::new()
$format.Alignment = [System.Drawing.StringAlignment]::Center
$format.LineAlignment = [System.Drawing.StringAlignment]::Center
$g.DrawString('JS', $font, $black, [System.Drawing.RectangleF]::new(294, 151, 174, 175), $format)
$pen = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#F5F7FA'), 11)
$pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$g.DrawLine($pen, 231, 239, 276, 239)
$g.DrawLine($pen, 260, 223, 276, 239)
$g.DrawLine($pen, 260, 255, 276, 239)
$bitmap.Save((Join-Path $PWD 'media\icon-html-js.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$pen.Dispose(); $format.Dispose(); $font.Dispose(); $black.Dispose(); $yellow.Dispose(); $shield.Dispose(); $g.Dispose(); $bitmap.Dispose()
