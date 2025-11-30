#!/bin/bash

# PlayCast Build Script
# Script tự động build app cho Android và iOS với HTTP Server Native Module

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}   $1${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

# Check if Android directory exists
check_ejected() {
    if [ -d "android" ]; then
        return 0
    else
        return 1
    fi
}

# Eject Expo
eject_expo() {
    print_header "EJECT EXPO PROJECT"

    if check_ejected; then
        print_warning "Project đã được eject rồi, bỏ qua bước này"
        return 0
    fi

    print_info "Đang eject Expo project..."
    npx expo prebuild
    print_success "Eject Expo thành công!"
}

# Install HTTP Server Native Module for Android
install_android_module() {
    print_header "CÀI ĐẶT HTTP SERVER MODULE CHO ANDROID"

    # Check if android directory exists
    if [ ! -d "android" ]; then
        print_error "Thư mục android không tồn tại. Vui lòng chạy eject trước."
        return 1
    fi

    # Create package directory
    ANDROID_PACKAGE_DIR="android/app/src/main/java/com/anonymous/playcast"
    print_info "Tạo thư mục package: $ANDROID_PACKAGE_DIR"
    mkdir -p "$ANDROID_PACKAGE_DIR"

    # Copy Java files
    print_info "Copy các file Java..."
    cp android-native-modules/HTTPServerModule.java "$ANDROID_PACKAGE_DIR/"
    cp android-native-modules/SimpleHTTPServer.java "$ANDROID_PACKAGE_DIR/"
    cp android-native-modules/HTTPServerPackage.java "$ANDROID_PACKAGE_DIR/"
    print_success "Đã copy 3 file Java vào Android project"

    # Add NanoHTTPD dependency to build.gradle
    print_info "Kiểm tra dependency trong build.gradle..."
    GRADLE_FILE="android/app/build.gradle"

    if grep -q "nanohttpd:2.3.1" "$GRADLE_FILE"; then
        print_warning "NanoHTTPD dependency đã tồn tại, bỏ qua"
    else
        print_info "Thêm NanoHTTPD dependency vào build.gradle..."
        # Add dependency after implementation("com.facebook.react:react-android")
        sed -i '/implementation("com.facebook.react:react-android")/a\
\
    \/\/ HTTP Server for LAN file sharing\
    implementation '\''org.nanohttpd:nanohttpd:2.3.1'\''' "$GRADLE_FILE"
        print_success "Đã thêm NanoHTTPD dependency"
    fi

    # Register package in MainApplication
    print_info "Kiểm tra MainApplication..."
    MAIN_APP_FILE="$ANDROID_PACKAGE_DIR/MainApplication.kt"

    if [ -f "$MAIN_APP_FILE" ]; then
        # Kotlin version
        if grep -q "HTTPServerPackage" "$MAIN_APP_FILE"; then
            print_warning "HTTPServerPackage đã được register, bỏ qua"
        else
            print_info "Thêm HTTPServerPackage vào MainApplication.kt..."
            # Add import
            sed -i '/import expo.modules.ReactNativeHostWrapper/a\
import com.anonymous.playcast.HTTPServerPackage' "$MAIN_APP_FILE"

            # Add package registration
            sed -i '/add(MyReactNativePackage())/a\
              add(HTTPServerPackage())' "$MAIN_APP_FILE"
            print_success "Đã register HTTPServerPackage trong MainApplication.kt"
        fi
    else
        # Try Java version
        MAIN_APP_FILE="$ANDROID_PACKAGE_DIR/MainApplication.java"
        if [ -f "$MAIN_APP_FILE" ]; then
            if grep -q "HTTPServerPackage" "$MAIN_APP_FILE"; then
                print_warning "HTTPServerPackage đã được register, bỏ qua"
            else
                print_info "Thêm HTTPServerPackage vào MainApplication.java..."
                # Add import
                sed -i '/import com.facebook.react.defaults.DefaultReactNativeHost;/a\
import com.anonymous.playcast.HTTPServerPackage;' "$MAIN_APP_FILE"

                # Add package registration
                sed -i '/packages.add(new MyReactNativePackage());/a\
        packages.add(new HTTPServerPackage());' "$MAIN_APP_FILE"
                print_success "Đã register HTTPServerPackage trong MainApplication.java"
            fi
        else
            print_error "Không tìm thấy MainApplication file"
            return 1
        fi
    fi

    print_success "Cài đặt HTTP Server Module cho Android hoàn tất!"
}

# Build Android
build_android() {
    print_header "BUILD ANDROID APP"

    print_info "Cleaning Android build..."
    cd android
    ./gradlew clean
    cd ..

    print_info "Building Android app..."
    npx expo run:android

    print_success "Build Android hoàn tất!"
}

# Build iOS (placeholder for future)
build_ios() {
    print_header "BUILD iOS APP"

    print_warning "iOS build chưa được hỗ trợ trong script này"
    print_info "Để build iOS, vui lòng:"
    echo "  1. Chạy: cd ios && pod install"
    echo "  2. Mở Xcode và build từ đó"
    echo "  3. Hoặc chạy: npx expo run:ios"
}

# Main menu
show_menu() {
    echo ""
    print_header "PLAYCAST BUILD SCRIPT"
    echo "Chọn platform để build:"
    echo ""
    echo "  1) 🤖 Android"
    echo "  2) 🍎 iOS"
    echo "  3) 🔄 Cài đặt lại HTTP Server Module (Android)"
    echo "  4) 🚀 Eject Expo (nếu chưa eject)"
    echo "  5) ❌ Thoát"
    echo ""
    read -p "Nhập lựa chọn [1-5]: " choice

    case $choice in
        1)
            print_info "Bạn đã chọn: Build Android"

            # Check if ejected
            if ! check_ejected; then
                print_info "Project chưa được eject, đang eject..."
                eject_expo
            fi

            # Install module
            install_android_module

            # Ask if user wants to build
            echo ""
            read -p "Bạn có muốn build app ngay không? (y/n): " build_now
            if [[ $build_now =~ ^[Yy]$ ]]; then
                build_android
            else
                print_info "Bỏ qua build. Bạn có thể build sau bằng lệnh: npx expo run:android"
            fi
            ;;
        2)
            print_info "Bạn đã chọn: Build iOS"

            # Check if ejected
            if ! check_ejected; then
                print_info "Project chưa được eject, đang eject..."
                eject_expo
            fi

            build_ios
            ;;
        3)
            print_info "Cài đặt lại HTTP Server Module cho Android"
            install_android_module
            print_success "Hoàn tất! Bạn có thể build lại bằng: npx expo run:android"
            ;;
        4)
            eject_expo
            print_success "Hoàn tất! Bạn có thể chạy lại script để cài đặt native module"
            ;;
        5)
            print_info "Thoát script"
            exit 0
            ;;
        *)
            print_error "Lựa chọn không hợp lệ"
            show_menu
            ;;
    esac
}

# Check dependencies
check_dependencies() {
    print_header "KIỂM TRA DEPENDENCIES"

    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js: $NODE_VERSION"
    else
        print_error "Node.js chưa được cài đặt!"
        exit 1
    fi

    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm: $NPM_VERSION"
    else
        print_error "npm chưa được cài đặt!"
        exit 1
    fi

    # Check if package.json exists
    if [ -f "package.json" ]; then
        print_success "package.json tìm thấy"
    else
        print_error "Không tìm thấy package.json. Vui lòng chạy script từ thư mục root của project"
        exit 1
    fi

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules chưa được cài đặt"
        print_info "Đang chạy npm install..."
        npm install
        print_success "npm install hoàn tất"
    else
        print_success "node_modules đã tồn tại"
    fi

    # Check if android-native-modules directory exists
    if [ -d "android-native-modules" ]; then
        print_success "android-native-modules directory tìm thấy"
    else
        print_error "Không tìm thấy thư mục android-native-modules!"
        exit 1
    fi
}

# Main execution
main() {
    clear
    print_header "🎬 PLAYCAST BUILD AUTOMATION SCRIPT"

    # Check dependencies
    check_dependencies

    # Show menu
    show_menu

    echo ""
    print_success "🎉 Script hoàn tất!"
    echo ""
}

# Run main function
main
