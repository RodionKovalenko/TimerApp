@echo off

REM IN YOUR SSL FOLDER, SAVE THIS FILE AS: makeCERT.bat
REM AT COMMAND LINE IN YOUR SSL FOLDER, RUN: makecert
REM IT WILL CREATE THESE FILES: example.cnf, example.crt, example.key
REM IMPORT THE .crt FILE INTO CHROME Trusted Root Certification Authorities
REM REMEMBER TO RESTART APACHE OR NGINX AFTER YOU CONFIGURE FOR THESE FILES

REM PLEASE UPDATE THE FOLLOWING VARIABLES FOR YOUR NEEDS.
SET FILENAME=server
SET /p HOSTNAME="Enter Domain: "
SET COUNTRY=DE
SET STATE=nrw
SET CITY=Essen
SET ORGANIZATION=IT
SET ORGANIZATION_UNIT=IT Department
SET EMAIL=webmaster@%HOSTNAME%

if not exist %HOSTNAME% mkdir %HOSTNAME%

(
echo [req]
echo default_bits = 2048
echo prompt = no
echo default_md = sha256
echo x509_extensions = v3_req
echo distinguished_name = dn
echo:
echo [dn]
echo C = %COUNTRY%
echo ST = %STATE%
echo L = %CITY%
echo O = %ORGANIZATION%
echo OU = %ORGANIZATION_UNIT%
echo emailAddress = %EMAIL%
echo CN = %HOSTNAME%
echo:
echo [v3_req]
echo subjectAltName = @alt_names
echo:
echo [alt_names]
echo DNS.1 = *.%HOSTNAME%
echo DNS.2 = %HOSTNAME%
)>%HOSTNAME%/%FILENAME%.cnf


openssl req -new -x509 -newkey rsa:2048 -sha256 -nodes -keyout %HOSTNAME%/%FILENAME%.key -days 3560 -out %HOSTNAME%/%FILENAME%.crt -config %HOSTNAME%/%FILENAME%.cnf

echo.
echo -----
echo The certificate was provided.
echo.
pause