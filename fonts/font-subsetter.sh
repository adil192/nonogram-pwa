# To be run in folder with full downloaded fonts
# Subsetted fonts will be saved in an `output` folder

ranges=(
  "00-1f"  # misc
  "20-3f"  # numbers and special characters
  "40-7f"  # A-Z and a-z
  "80-9f"  # misc
  "a0-ff"  # rest of basic latin

  # extended latin
  "100-1ff"
  "200-2ff"
  "300-3ff"
  "400-4ff"
  "500-5ff"
)
font_names=(
  "MPLUSRounded1c-Regular"
  "MPLUSRounded1c-Medium"
)
formats=(
  "woff2"
  "woff"
  ""  # empty gives us a ttf
)

mkdir output -p

for range in "${ranges[@]}"
do :

  for font_name in "${font_names[@]}"
  do :
    new_font_name="${font_name}.${range}"

    echo "// Subset of ${font_name}.ttf with unicode range ${range}"

    # perform subsetting with different formats
    for format in "${formats[@]}"
    do :
      extension=$format
      if [[ -z $format ]]; then
        extension="ttf"
      fi

      pyftsubset "${font_name}.ttf" --unicodes="${range}" --ignore-missing-unicodes \
        --with-zopfli --recommended-glyphs --flavor="${format}" \
        --output-file="output/${new_font_name}.${extension}"
    done

    # process variables
    weight="400"
    if [ "$font_name" == "MPLUSRounded1c-Medium" ]; then
      weight="500"
    fi

    # output css
    echo "@font-face {
	font-family: 'MPLUSRounded1c';
	font-style: normal;
	font-weight: ${weight};
	font-display: swap;
	src: local('MPLUSRounded1c'), local('M PLUS Rounded 1c'),
	url('/nonogram/fonts/font-files/${new_font_name}.woff2') format('woff2'),
	url('/nonogram/fonts/font-files/${new_font_name}.woff') format('woff'),
	url('/nonogram/fonts/font-files/${new_font_name}.ttf') format('truetype');
	unicode-range: U+${range};
}"

  done

done
