vegeta attack -targets=./targets.txt -duration=60s -rate=20 -workers=10 > results.bin
vegeta report results.bin > report.txt
vegeta plot results.bin > plot.html