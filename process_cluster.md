http://nodejs.cn/api/child_process.html#child_process_options_stdio
options.stdio 选项用于配置子进程与父进程之间建立的管道。
 默认情况下，子进程的 stdin、 stdout 和 stderr 会重定向到 ChildProcess 对象上相应的 subprocess.stdin、 subprocess.stdout 和 subprocess.stderr 流。 这等同于将 options.stdio 设为 ['pipe', 'pipe', 'pipe']。