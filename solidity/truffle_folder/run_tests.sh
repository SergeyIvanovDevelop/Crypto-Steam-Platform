#!/bin/bash
#This is comment
echo -e "truffle test\ntruffle exec ./stop_truffle.js" | truffle develop > truffle_test_output.txt
count_errors="$(cat truffle_test_output.txt | grep -c 'Error')"
echo "count_errors = $count_errors"
if [ $count_errors -eq 0 ]
then
  cat truffle_test_output.txt
  echo Test finished succesfull.
  exit 0
else
  cat truffle_test_output.txt
  echo Test Faild.
  exit 1
fi

