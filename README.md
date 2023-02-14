# Smilodon
A discord bot for our private server

Installing discord.py library
----------
**Python 3.8 or higher is required**

To install the library without full voice support, you can just run the following command:
```sh
# Linux/macOS
python3 -m pip install -U discord.py

# Windows
py -3 -m pip install -U discord.py
```

Otherwise to get voice support you should run the following command:
```sh
# Linux/macOS
python3 -m pip install -U "discord.py[voice]"

# Windows
py -3 -m pip install -U discord.py[voice]
```

To install the development version, do the following:
```sh
$ git clone https://github.com/Rapptz/discord.py
$ cd discord.py
$ python3 -m pip install -U .[voice]
```