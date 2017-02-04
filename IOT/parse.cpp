#include <iostream>
#include <vector>

typedef struct t_device {
    std::string ip;
    std::string mac;
    std::string interface;
} device;

int main() {
    std::vector<device> devices;
    std::string input = "";
    int state = 0;

    while (getline(std::cin, input)) {
        state = 0;
        devices.push_back(device());

        for (int i = 2; i < input.size(); ++i) {
            if (input[i] == ' ') {
                ++state;
            }
            else {
                switch (state) {
                    // IP
                    case 0:
                        if (input[i] == '(' || input[i] == ')') continue;

                        devices[devices.size() - 1].ip += input[i];
                        break;
                    // at
                    case 1: break;
                    // MAC Address
                    case 2:
                        devices[devices.size() - 1].mac += input[i];
                        break;
                    // on
                    case 3: break;
                    // Interface
                    case 4:
                        devices[devices.size() - 1].interface += input[i];
                        break;
                }
            }
        }

        //TOOD system("curl etc etc etc");

        printf("%s, ", devices[devices.size() - 1].ip.c_str());
        printf("%s, ", devices[devices.size() - 1].mac.c_str());
        printf("%s\n", devices[devices.size() - 1].interface.c_str());
    }
}
