#!/usr/bin/python
# -*- coding: utf-8 -*-
# Created by jenkins on 2020/4/30.
#解析IPA
import zipfile, plistlib, sys, re
import json
import base64
import os
import binascii

# IPA图片还原
#----------------IPA中PNG图片还原0----------------
from struct import *
from zlib import *
import stat
import sys
import os
import zlib

def getNormalizedPNG(filename,isFile):
	if(isFile==False):
		oldPNG=filename
	else:
		with open(filename, 'rb') as file_obj:
			oldPNG = file_obj.read()
			file_obj.close()
		
	pngheader = b"\x89PNG\r\n\x1a\n"
	if oldPNG[:8] != pngheader:
		return None

	newPNG = oldPNG[:8]

	chunkPos = len(newPNG)
	chunkD = bytearray()

	foundCGBi = False

	# For each chunk in the PNG file
	while chunkPos < len(oldPNG):

		# Reading chunk
		chunkLength = oldPNG[chunkPos:chunkPos+4]
		chunkLength = unpack(">L", chunkLength)[0]
		chunkType = oldPNG[chunkPos+4 : chunkPos+8]
		chunkData = oldPNG[chunkPos+8:chunkPos+8+chunkLength]
		chunkCRC = oldPNG[chunkPos+chunkLength+8:chunkPos+chunkLength+12]
		chunkCRC = unpack(">L", chunkCRC)[0]
		chunkPos += chunkLength + 12

		# Parsing the header chunk
		if chunkType == b"IHDR":
			width = unpack(">L", chunkData[0:4])[0]
			height = unpack(">L", chunkData[4:8])[0]

		# Parsing the image chunk
		if chunkType == b"IDAT":
			# Concatename all image data chunks
			chunkD += chunkData
			continue

		# Stopping the PNG file parsing
		if chunkType == b"IEND":
			if not foundCGBi:
				print ('Already normalized')
				return None

			bufSize = width * height * 4 + height
			chunkData = decompress(chunkD, -8, bufSize)

			# Swapping red & blue bytes for each pixel
			chunkData = bytearray(chunkData)
			offset = 1
			for y in range(height):
				for x in range(width):
					chunkData[offset+4*x],chunkData[offset+4*x+2] = chunkData[offset+4*x+2],chunkData[offset+4*x]
				offset += 1+4*width

			# Compressing the image chunk
			#chunkData = newdata
			chunkData = compress( chunkData )
			chunkLength = len( chunkData )
			chunkCRC = crc32(b'IDAT')
			chunkCRC = crc32(chunkData, chunkCRC)
			chunkCRC = (chunkCRC + 0x100000000) % 0x100000000

			newPNG += pack(">L", chunkLength)
			newPNG += b'IDAT'
			newPNG += chunkData
			newPNG += pack(">L", chunkCRC)

			chunkCRC = crc32(chunkType)
			newPNG += pack(">L", 0)
			newPNG += b'IEND'
			newPNG += pack(">L", chunkCRC)
			break

		# Removing CgBI chunk
		if chunkType == b"CgBI":
			foundCGBi = True
		else:
			newPNG += pack(">L", chunkLength)
			newPNG += chunkType
			if chunkLength > 0:
				newPNG += chunkData
			newPNG += pack(">L", chunkCRC)

	return newPNG


def updatePNGData(filename,isFile):
	data = getNormalizedPNG(filename,isFile)
	if data != None:
		return data;
	return None;

	
def updatePNG(filename,isFile):
	data = getNormalizedPNG(filename,isFile)
	if data != None:
		file = open("/Users/jenkins/Desktop/Unity-iPhone 2020-05-07 16-33-18/"+'_fixed.png', "wb")
		file.write(data)
		file.close()
		return True
	return data
#----------------IPA中PNG图片还原0----------------



#-------解析IPA文件
def analyze_ipa_with_plistlib(ipa_path):
	ipa_file = zipfile.ZipFile(ipa_path)
	plist_path = find_plist_path(ipa_file)
	plist_data = ipa_file.read(plist_path)
	plist_root = plistlib.loads(plist_data)
	icon_path=os.path.dirname(plist_path)+"/AppIcon60x60@2x.png"
	data = ipa_file.read(icon_path)
	data =updatePNGData(data, False)
	base64_data = base64.b64encode(data)
	base64_dataStr = base64_data.decode()
	plist_root["AppIconBase64"]=base64_dataStr
	return plist_root

def find_plist_path(zip_file):
	name_list = zip_file.namelist()
	pattern = re.compile(r'Payload/[^/]*.app/Info.plist')
	for path in name_list:
		m = pattern.match(path)
		if m is not None:
			return m.group()
			
			
def appMain(argv):
	if argv == None:
		print('world~!')
		return
	ipa_path= argv[1]
	ipaInfo=analyze_ipa_with_plistlib(ipa_path)
	ipaInfoStr = json.dumps(ipaInfo) # note i gave it a different name
	print(ipaInfoStr)
	
#	print(ipaInfo["CFBundleVersion"])
#	print(ipaInfo["CFBundleShortVersionString"])
#	print(ipaInfo["CFBundleDisplayName"])
#	print(ipaInfo["CFBundleIdentifier"])

def testDemo(ipa_path):
	ipaInfo=analyze_ipa_with_plistlib(ipa_path)
	ipaInfoStr = json.dumps(ipaInfo) # note i gave it a different name
	print(ipaInfoStr)
	
	
	
if __name__ == '__main__':
	appMain(sys.argv)
#	testDemo("/Users/jenkins/Desktop/Unity-iPhone 2020-05-07 16-33-18/神起_重生之明月传说_圣域逍遥0507.ipa")
#	updatePNG("/Users/jenkins/Desktop/Unity-iPhone 2020-05-05 09-26-56/AppIcon60x60@3x.png",True)