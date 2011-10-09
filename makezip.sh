# Create zip but not in the same dir of the source
rm WatchDoc.zip
cd src
zip -r ../WatchDoc.zip *
cd ..
