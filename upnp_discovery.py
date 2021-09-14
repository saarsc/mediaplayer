import upnpclient 

devices = upnpclient.discover()

for device in devices:
    print(device.device_name)
#     name = device.device_name
#     columnIndex = name.rindex(":")
#     backSlash = name[columnIndex:].index("/")
#     print(name[:backSlash + columnIndex])