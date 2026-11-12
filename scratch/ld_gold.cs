using System;
using System.Diagnostics;
using System.IO;

class Program {
    static int Main(string[] args) {
        string dir = AppDomain.CurrentDomain.BaseDirectory;
        string lldPath = Path.Combine(dir, "ld.lld.exe");
        
        string arguments = "";
        foreach (string arg in args) {
            if (arguments.Length > 0) arguments += " ";
            if (arg.Contains(" ")) {
                arguments += "\"" + arg + "\"";
            } else {
                arguments += arg;
            }
        }
        
        ProcessStartInfo psi = new ProcessStartInfo();
        psi.FileName = lldPath;
        psi.Arguments = arguments;
        psi.UseShellExecute = false;
        psi.RedirectStandardOutput = false;
        psi.RedirectStandardError = false;
        
        using (Process p = Process.Start(psi)) {
            p.WaitForExit();
            return p.ExitCode;
        }
    }
}
