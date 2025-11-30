@echo off
REM PlayCast Build Script for Windows
REM Script tự động build app cho Android với HTTP Server Native Module

setlocal enabledelayedexpansion

REM Colors (limited in batch, using symbols instead)
set "INFO=[INFO]"
set "SUCCESS=[OK]"
set "WARNING=[WARNING]"
set "ERROR=[ERROR]"

:HEADER
echo.
echo ================================================
echo    PLAYCAST BUILD AUTOMATION SCRIPT
echo ================================================
echo.
goto CHECK_DEPS

:CHECK_DEPS
echo.
echo ================================================
echo    KIEM TRA DEPENDENCIES
echo ================================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo %ERROR% Node.js chua duoc cai dat!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo %SUCCESS% Node.js: %NODE_VERSION%

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo %ERROR% npm chua duoc cai dat!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo %SUCCESS% npm: %NPM_VERSION%

REM Check package.json
if not exist "package.json" (
    echo %ERROR% Khong tim thay package.json
    echo Vui long chay script tu thu muc root cua project
    pause
    exit /b 1
)
echo %SUCCESS% package.json tim thay

REM Check node_modules
if not exist "node_modules" (
    echo %WARNING% node_modules chua duoc cai dat
    echo %INFO% Dang chay npm install...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo %ERROR% npm install that bai
        pause
        exit /b 1
    )
    echo %SUCCESS% npm install hoan tat
) else (
    echo %SUCCESS% node_modules da ton tai
)

REM Check android-native-modules
if not exist "android-native-modules" (
    echo %ERROR% Khong tim thay thu muc android-native-modules!
    pause
    exit /b 1
)
echo %SUCCESS% android-native-modules directory tim thay

goto MENU

:MENU
echo.
echo ================================================
echo    PLAYCAST BUILD MENU
echo ================================================
echo.
echo Chon platform de build:
echo.
echo   1. Android
echo   2. iOS (chua ho tro)
echo   3. Cai dat lai HTTP Server Module (Android)
echo   4. Eject Expo (neu chua eject)
echo   5. Thoat
echo.
set /p choice="Nhap lua chon [1-5]: "

if "%choice%"=="1" goto BUILD_ANDROID
if "%choice%"=="2" goto BUILD_IOS
if "%choice%"=="3" goto INSTALL_MODULE
if "%choice%"=="4" goto EJECT_EXPO
if "%choice%"=="5" goto EXIT
echo %ERROR% Lua chon khong hop le
goto MENU

:CHECK_EJECTED
if exist "android" (
    exit /b 0
) else (
    exit /b 1
)

:EJECT_EXPO
echo.
echo ================================================
echo    EJECT EXPO PROJECT
echo ================================================
echo.

call :CHECK_EJECTED
if %ERRORLEVEL% EQU 0 (
    echo %WARNING% Project da duoc eject roi, bo qua buoc nay
    pause
    goto MENU
)

echo %INFO% Dang eject Expo project...
call npx expo prebuild
if %ERRORLEVEL% NEQ 0 (
    echo %ERROR% Eject Expo that bai
    pause
    goto MENU
)
echo %SUCCESS% Eject Expo thanh cong!
pause
goto MENU

:INSTALL_MODULE
echo.
echo ================================================
echo    CAI DAT HTTP SERVER MODULE CHO ANDROID
echo ================================================
echo.

REM Check if android directory exists
if not exist "android" (
    echo %ERROR% Thu muc android khong ton tai. Vui long chay eject truoc.
    pause
    goto MENU
)

REM Create package directory
set "ANDROID_PKG_DIR=android\app\src\main\java\com\anonymous\playcast"
echo %INFO% Tao thu muc package: %ANDROID_PKG_DIR%
if not exist "%ANDROID_PKG_DIR%" mkdir "%ANDROID_PKG_DIR%"

REM Copy Java files
echo %INFO% Copy cac file Java...
copy /Y "android-native-modules\HTTPServerModule.java" "%ANDROID_PKG_DIR%\"
copy /Y "android-native-modules\SimpleHTTPServer.java" "%ANDROID_PKG_DIR%\"
copy /Y "android-native-modules\HTTPServerPackage.java" "%ANDROID_PKG_DIR%\"
if %ERRORLEVEL% NEQ 0 (
    echo %ERROR% Copy file Java that bai
    pause
    goto MENU
)
echo %SUCCESS% Da copy 3 file Java vao Android project

REM Check NanoHTTPD dependency
echo %INFO% Kiem tra dependency trong build.gradle...
set "GRADLE_FILE=android\app\build.gradle"
findstr /C:"nanohttpd:2.3.1" "%GRADLE_FILE%" >nul
if %ERRORLEVEL% EQU 0 (
    echo %WARNING% NanoHTTPD dependency da ton tai, bo qua
) else (
    echo %INFO% Them NanoHTTPD dependency vao build.gradle...
    echo %WARNING% Ban can them dong sau vao %GRADLE_FILE% thu cong:
    echo     implementation 'org.nanohttpd:nanohttpd:2.3.1'
    echo Sau dong: implementation("com.facebook.react:react-android")
)

REM Check MainApplication
echo %INFO% Kiem tra MainApplication...
set "MAIN_APP_KT=%ANDROID_PKG_DIR%\MainApplication.kt"
set "MAIN_APP_JAVA=%ANDROID_PKG_DIR%\MainApplication.java"

if exist "%MAIN_APP_KT%" (
    findstr /C:"HTTPServerPackage" "%MAIN_APP_KT%" >nul
    if %ERRORLEVEL% EQU 0 (
        echo %WARNING% HTTPServerPackage da duoc register, bo qua
    ) else (
        echo %INFO% Da tim thay MainApplication.kt
        echo %WARNING% Ban can them vao %MAIN_APP_KT% thu cong:
        echo.
        echo 1. Them import:
        echo    import com.anonymous.playcast.HTTPServerPackage
        echo.
        echo 2. Them vao getPackages:
        echo    add(HTTPServerPackage())
    )
) else if exist "%MAIN_APP_JAVA%" (
    findstr /C:"HTTPServerPackage" "%MAIN_APP_JAVA%" >nul
    if %ERRORLEVEL% EQU 0 (
        echo %WARNING% HTTPServerPackage da duoc register, bo qua
    ) else (
        echo %INFO% Da tim thay MainApplication.java
        echo %WARNING% Ban can them vao %MAIN_APP_JAVA% thu cong:
        echo.
        echo 1. Them import:
        echo    import com.anonymous.playcast.HTTPServerPackage;
        echo.
        echo 2. Them vao getPackages:
        echo    packages.add(new HTTPServerPackage());
    )
)

echo.
echo %SUCCESS% Cai dat HTTP Server Module cho Android hoan tat!
pause
goto MENU

:BUILD_ANDROID
echo.
echo ================================================
echo    BUILD ANDROID APP
echo ================================================
echo.

call :CHECK_EJECTED
if %ERRORLEVEL% NEQ 0 (
    echo %INFO% Project chua duoc eject, dang eject...
    call npx expo prebuild
    if %ERRORLEVEL% NEQ 0 (
        echo %ERROR% Eject that bai
        pause
        goto MENU
    )
)

REM Install module
call :INSTALL_MODULE

REM Ask if user wants to build
echo.
set /p build_now="Ban co muon build app ngay khong? (y/n): "
if /i "%build_now%"=="y" (
    echo.
    echo %INFO% Cleaning Android build...
    cd android
    call gradlew clean
    cd ..

    echo %INFO% Building Android app...
    call npx expo run:android
    if %ERRORLEVEL% NEQ 0 (
        echo %ERROR% Build that bai
        pause
        goto MENU
    )
    echo %SUCCESS% Build Android hoan tat!
) else (
    echo %INFO% Bo qua build. Ban co the build sau bang lenh: npx expo run:android
)

pause
goto MENU

:BUILD_IOS
echo.
echo ================================================
echo    BUILD iOS APP
echo ================================================
echo.

echo %WARNING% iOS build chua duoc ho tro trong script nay
echo %INFO% De build iOS, vui long:
echo   1. Chay: cd ios ^&^& pod install
echo   2. Mo Xcode va build tu do
echo   3. Hoac chay: npx expo run:ios

pause
goto MENU

:EXIT
echo.
echo %INFO% Thoat script
echo %SUCCESS% Cam on ban da su dung PlayCast Build Script!
echo.
pause
exit /b 0
