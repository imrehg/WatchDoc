import png

# List of files to combine
# filelist = ['icon_7_generic_list.png',
#             'icon_7_document_list.png',
#             'icon_7_presentation_list.png',
#             'icon_7_spreadsheet_list.png',
#             'icon_7_form_list.png',
#             'icon_7_drawing_list.png',
#             'icon_7_collection_list.png',
#             'icon_7_pdf_list.png',
#             'icon_7_image_list.png',
#             'icon_7_powerpoint_list.png',
#             ]
# filelist = ['icon_8_generic_list.png',
#             'icon_8_document_list.png',
#             'icon_8_presentation_list.png',
#             'icon_8_spreadsheet_list.png',
#             'icon_8_form_list.png',
#             'icon_8_drawing_list.png',
#             'icon_8_collection_list.png',
#             'icon_8_pdf_list.png',
#             'icon_8_image_list.png',
#             'icon_8_powerpoint_list.png',
#             ]
filelist = ['icon_9_generic_list.png',
            'icon_9_document_list.png',
            'icon_9_presentation_list.png',
            'icon_9_spreadsheet_list.png',
            'icon_9_form_list.png',
            'icon_9_drawing_list.png',
            'icon_8_collection_list.png',
            'icon_9_pdf_list.png',
            'icon_9_image_list.png',
            'icon_9_powerpoint_list.png',
            'icon_9_fusion_list.png',
            'icon_9_word_list.png',
            ]

imgs = [png.Reader(filename).asRGBA() for filename in filelist]
w, h = imgs[0][0:2]
totalw = w * len(filelist) * 4  # RGBA
totalh = h

output = [[0 for i in xrange(totalw)] for j in xrange(totalh)]

for i in xrange(len(imgs)):
    print filelist[i]
    for j, row in enumerate(imgs[i][2]):
        for k, val in enumerate(row):
            output[j][i*w*4 + k] = val

png.from_array(output, 'RGBA').save('sprite.png')
