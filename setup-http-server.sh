#!/bin/bash

# PlayCast HTTP Server Setup Script
# This script automates the installation of HTTP Server native module

set -e

echo "======================================"
echo "PlayCast HTTP Server Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if android directory exists
if [ ! -d "android" ]; then
    echo -e "${RED}Error: android/ directory not found${NC}"
    echo ""
    echo "You need to eject from Expo first:"
    echo "  npx expo prebuild"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Found android/ directory${NC}"

# Create target directory if it doesn't exist
TARGET_DIR="android/app/src/main/java/com/playcast"
if [ ! -d "$TARGET_DIR" ]; then
    echo -e "${YELLOW}Creating directory: $TARGET_DIR${NC}"
    mkdir -p "$TARGET_DIR"
fi

# Copy Java files
echo ""
echo "Copying Java files..."
echo ""

if [ -f "android-native-modules/HTTPServerModule.java" ]; then
    cp android-native-modules/HTTPServerModule.java "$TARGET_DIR/"
    echo -e "${GREEN}✓ Copied HTTPServerModule.java${NC}"
else
    echo -e "${RED}✗ HTTPServerModule.java not found${NC}"
    exit 1
fi

if [ -f "android-native-modules/SimpleHTTPServer.java" ]; then
    cp android-native-modules/SimpleHTTPServer.java "$TARGET_DIR/"
    echo -e "${GREEN}✓ Copied SimpleHTTPServer.java${NC}"
else
    echo -e "${RED}✗ SimpleHTTPServer.java not found${NC}"
    exit 1
fi

if [ -f "android-native-modules/HTTPServerPackage.java" ]; then
    cp android-native-modules/HTTPServerPackage.java "$TARGET_DIR/"
    echo -e "${GREEN}✓ Copied HTTPServerPackage.java${NC}"
else
    echo -e "${RED}✗ HTTPServerPackage.java not found${NC}"
    exit 1
fi

# Check and update build.gradle
echo ""
echo "Checking build.gradle..."
GRADLE_FILE="android/app/build.gradle"

if grep -q "nanohttpd:2.3.1" "$GRADLE_FILE"; then
    echo -e "${GREEN}✓ NanoHTTPD dependency already exists${NC}"
else
    echo -e "${YELLOW}! Adding NanoHTTPD dependency to build.gradle${NC}"

    # Add dependency before the last closing brace in dependencies block
    sed -i "/dependencies {/,/^}/ s/^}/    implementation 'org.nanohttpd:nanohttpd:2.3.1'\n}/" "$GRADLE_FILE"

    echo -e "${GREEN}✓ Added NanoHTTPD dependency${NC}"
fi

# Check MainApplication file
echo ""
echo "Checking MainApplication..."

MAIN_APP_JAVA="android/app/src/main/java/com/playcast/MainApplication.java"
MAIN_APP_KT="android/app/src/main/java/com/playcast/MainApplication.kt"

if [ -f "$MAIN_APP_JAVA" ]; then
    MAIN_APP="$MAIN_APP_JAVA"
    LANG="java"
elif [ -f "$MAIN_APP_KT" ]; then
    MAIN_APP="$MAIN_APP_KT"
    LANG="kotlin"
else
    echo -e "${RED}Error: MainApplication file not found${NC}"
    echo ""
    echo "Please manually register HTTPServerPackage in your MainApplication file."
    echo "See SETUP_INSTRUCTIONS.md for details."
    exit 1
fi

echo "Found: $MAIN_APP ($LANG)"

# Check if HTTPServerPackage is already registered
if grep -q "HTTPServerPackage" "$MAIN_APP"; then
    echo -e "${GREEN}✓ HTTPServerPackage already registered${NC}"
else
    echo -e "${YELLOW}! You need to manually register HTTPServerPackage${NC}"
    echo ""
    echo "Add this to your MainApplication file:"
    echo ""

    if [ "$LANG" = "java" ]; then
        echo "1. Add import:"
        echo "   import com.playcast.HTTPServerPackage;"
        echo ""
        echo "2. In getPackages() method, add:"
        echo "   packages.add(new HTTPServerPackage());"
    else
        echo "1. Add import:"
        echo "   import com.playcast.HTTPServerPackage"
        echo ""
        echo "2. In getPackages() method, add:"
        echo "   packages.add(HTTPServerPackage())"
    fi

    echo ""
    echo "See android-native-modules/SETUP_INSTRUCTIONS.md for detailed instructions."
fi

echo ""
echo "======================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Register HTTPServerPackage in MainApplication (if not done automatically)"
echo "2. Clean build: cd android && ./gradlew clean && cd .."
echo "3. Run app: npx expo run:android"
echo ""
echo "See android-native-modules/SETUP_INSTRUCTIONS.md for more details."
echo ""
