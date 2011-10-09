
TYPES=( 'image' 'presentation' 'document' 'powerpoint' 'spreadsheet' 'drawing' 'generic' 'form' 'pdf' 'collection' 'fusion' 'word')
for type in ${TYPES[@]}
do
   echo ${type}
   wget -c https://ssl.gstatic.com/docs/doclist/images/icon_9_${type}_list.png
done
