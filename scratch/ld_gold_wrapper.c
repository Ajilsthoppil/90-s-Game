#include <process.h>
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char* argv[]) {
    char** newArgv = (char**)malloc((argc + 1) * sizeof(char*));
    newArgv[0] = "ld.lld.exe";
    for (int i = 1; i < argc; i++) {
        newArgv[i] = argv[i];
    }
    newArgv[argc] = NULL;
    return _spawnvp(_P_WAIT, "ld.lld.exe", newArgv);
}
