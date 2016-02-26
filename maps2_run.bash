#!/bin/bash

. /opt/ferret-6.82/ferret_paths

#===========================================
ferret -nojnl -gif <<EOS > /dev/null 2>&1

cancel mode logo

let width=800 ; let width_default=824
let height=600 ; let height_default=617
set window/aspect=\`height/width\`/size=\`(0.7*width*height)/(width_default*height_default)\`

ppl color 6,90,90,90

use "/prodigfs/project/EUROCORDEX/NCEP/NCEP_slp.des"

let SLP2 = SLP/100
set variable/units="mb"/title="SLP" SLP2

$1/grat=(dash,color=6) SLP2[k=1,t="$2":"$3"@ave]

go land_detail 1 overlay 6

frame/file=tmp_$$.gif

exit

EOS
#===========================================

cat tmp_$$.gif

rm tmp_$$.gif
rm .gif*