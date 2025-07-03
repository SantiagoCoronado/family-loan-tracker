#!/bin/bash

# PWA Icon Generator for Family Loan Tracker
# Converts SVG icon to all required PNG sizes

echo "🎨 Generating PWA Icons for Family Loan Tracker..."

# Check if ImageMagick is available
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick (convert) not found."
    echo "📥 Install it with:"
    echo "   macOS: brew install imagemagick"
    echo "   Ubuntu: sudo apt-get install imagemagick"
    echo "   Windows: Download from https://imagemagick.org/"
    exit 1
fi

# Create icons directory if it doesn't exist
mkdir -p icons

# Define icon sizes needed for PWA
sizes=(72 96 128 144 152 192 384 512)

echo "📝 Converting SVG to PNG icons..."

# Convert SVG to each required size
for size in "${sizes[@]}"; do
    echo "   🔄 Generating ${size}x${size} icon..."
    convert -background none -size ${size}x${size} icons/icon.svg icons/icon-${size}.png
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Generated icon-${size}.png"
    else
        echo "   ❌ Failed to generate icon-${size}.png"
    fi
done

echo ""
echo "🎉 Icon generation complete!"
echo "📂 Generated icons in the 'icons' directory:"
ls -la icons/

echo ""
echo "🚀 Your PWA is now ready for deployment!"
echo "📱 These icons will enable:"
echo "   • App installation on mobile devices"
echo "   • Proper display in app switchers"
echo "   • Home screen icons"
echo "   • Splash screen branding"

# Alternative: Generate a simple colored square as fallback
echo ""
echo "🔧 Alternative: Creating simple fallback icons..."

for size in "${sizes[@]}"; do
    # Create a simple blue square with white $ symbol as fallback
    convert -size ${size}x${size} xc:"#3b82f6" \
            -fill white -font Arial-Bold -pointsize $((size/8)) \
            -gravity center -annotate +0+0 '$' \
            icons/icon-${size}-fallback.png
    echo "   💙 Created fallback icon-${size}-fallback.png"
done

echo ""
echo "✨ Icons ready! You can use either the SVG-converted icons or the fallback icons." 