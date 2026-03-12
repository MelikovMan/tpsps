vegeta attack -targets=./targets.txt -duration=20s -rate=5 > results/results.bin
vegeta report results/results.bin > results/report.txt
vegeta plot results/results.bin > results/plot.html