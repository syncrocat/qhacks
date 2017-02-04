for i in {2..254}; do
    ping -c 1 -t 1 192.168.0.$i &> /dev/null &
done
arp -an | grep "at [a-z0-9]" > result.txt
