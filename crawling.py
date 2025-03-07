# lib request
import requests
from bs4 import BeautifulSoup
from datetime import datetime,timezone
# lib selenium
    
from selenium import webdriver
# from selenium.webdriver.common.keys import Keys
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.common.by import By
import time
import subprocess
import os
import sys



def get_resource_path(filename):
        # if run with file .app get this path
        if getattr(sys, 'frozen', False):
            base_path = os.path.join(sys._MEIPASS, "Contents/Resources")
        else:
            base_path = os.path.abspath(".")

        return os.path.join(base_path, filename)

def chooseSeleniumOs():
     # setup firefox site
    options = Options()
    options.add_argument('--private')
    options.add_argument('--headless')
    if os.name == 'nt':
        # driver = webdriver.Firefox(executable_path=r'./geckodriver.exe', options=options)
        webdriver_service = FirefoxService(executable_path= get_resource_path("geckodriver.exe"))
        webdriver_service.creation_flags = subprocess.CREATE_NO_WINDOW 
        driver = webdriver.Firefox(service=webdriver_service, options=options)
    elif os.name == 'posix':
        driver = webdriver.Firefox(options=options)
    return driver

def crawlDogeMing():
    dataResponse = {'status' : True, 'response' : []}
    try:
        dt = datetime.now(timezone.utc).replace(tzinfo=None)
        timeStamp = int(datetime.timestamp(dt))
        resMini = requests.get('https://www.mining-dutch.nl/pools/dogecoin.php?page=api&action=getdashboarddata&api_key=&id=&_=' + str(timeStamp))
        profitability = int(round(float(resMini.json()['getdashboarddata']['data']['pool']['price']) * 100000000))
        difficulty_mining = int(resMini.json()['getdashboarddata']['data']['network']['difficulty'][0:4])
        response = ''
        dataResponse['response'] = [profitability,difficulty_mining, response]
    except Exception as e:
        dataResponse['status'] = False
        dataResponse['response'] = f"Error CrawlDogeMing {e}"
        pass
    return dataResponse
def crawlFractalbitcoin():
    dataResponse = {'status' : True, 'response' : []}
    try :
        dt = datetime.now(timezone.utc).replace(tzinfo=None)
        timeStamp = int(datetime.timestamp(dt))
        resMini = requests.get('https://www.mining-dutch.nl/pools/fractalbitcoin.php?page=api&action=getdashboarddata&api_key=&id=&_=' + str(timeStamp))
        difficulty_frata = round(float(resMini.json()['getdashboarddata']['data']['network']['difficulty']) / 10000000)
        dataResponse['response'] = difficulty_frata
    except Exception as e:
        dataResponse['status'] = False
        dataResponse['response'] = f"Error crawlFractalbitcoin {e}"
        pass
    return dataResponse
def crawlDogeChain(user_cookies):
    cookies = {
        'cf_clearance' : str(user_cookies[1]),
        }
    header = {
        'User-Agent' : str(user_cookies[0]).replace('\n', ''),
    }
    
    dataResponse = {'status' : True, 'response' : []}
    try:
        dt = datetime.now(timezone.utc).replace(tzinfo=None)
        reschain = requests.get('https://dogechain.info/', cookies=cookies, headers=header)
        html_content = reschain.text
        soup = BeautifulSoup(html_content, "html.parser")
        difficulty_DogeChain = int(soup.find('h3',{'id':'block_difficulty'}).get_text().replace(',','')[0:4])
        block = soup.find_all('tr')
        blockinfor =  block[1].find_all('td')
        blockNumber = blockinfor[0].get_text()
        blockTime = str(dt - datetime.strptime(blockinfor[1].find('abbr').get('title'), '%Y-%m-%dT%H:%M:%SZ'))[:7]
        blockTransactions = blockinfor[2].get_text()
        blockReward = blockinfor[3].get_text()
        blockSize = blockinfor[4].get_text()
        dataBlock = [blockNumber, blockTime, blockTransactions,blockReward,blockSize]
        dataResponse['response'] = [difficulty_DogeChain, dataBlock]
    except Exception as e:
        dataResponse['status'] = False
        dataResponse['response'] = f"Error crawlDogeChain {e}"
        pass
    return dataResponse


def crawWhattomine():
    dataResponse = {'status' : True, 'response' : []}
    try : 
        driver = chooseSeleniumOs()
    except Exception as e:
        dataResponse['status'] = False
        dataResponse['response'] = f"Error create Selenium {e}"
        return dataResponse
    try:
        driver.get("https://whattomine.com/coins/431-fb-sha-256?hr=1000.0")
        element= driver.find_elements(By.CLASS_NAME, 'font-monospace')
        rev_BTCperDay = element[8].text
        dataResponse['response'] = rev_BTCperDay
        element.clear()
    except Exception as e:
        dataResponse['status'] = False
        dataResponse['response'] = f"Error CrawlWhattomine {e}"
        pass
    driver.delete_all_cookies()
    # driver.close()
    driver.quit()
    return dataResponse

def crawUnisat():
    dataResponse = {'status' : True, 'response' : []}
    try : 
        driver = chooseSeleniumOs()
    except Exception as e:
        dataResponse['status'] = False
        dataResponse['response'] = f"Error create Selenium {e}"
        return dataResponse
    try:
        driver.get("https://fractal.unisat.io/explorer/block/ef9dc9d5ba31f410d67f1be2f6419c21cbfe17746b4bca08b283fd412eb26485")
        time.sleep(1)
        element= driver.find_elements(By.CLASS_NAME, 'not-confirmed-block-div-right-confirmed')
        firstBlock = element[0]
        firstBlockName1 =  firstBlock.find_element(By.CLASS_NAME, 'font12').text
        firstBlockName2 = firstBlock.find_element(By.CLASS_NAME, 'text-FFEC9F').text
        firstBlockName3 = firstBlock.find_element(By.CLASS_NAME, 'font16').text .replace('\n', ' ')
        firstBlockTransaction = firstBlock.find_element(By.CLASS_NAME, 'font10').text
        firstBlockTime = firstBlock.find_element(By.CLASS_NAME, 'font11').text 
        dataResponse['response'] = [firstBlockName1, firstBlockName2, firstBlockName3, firstBlockTransaction, firstBlockTime]
        element.clear()
    except Exception as e:
        dataResponse['status'] = False
        dataResponse['response'] = f"Error crawUnisat {e}"
        pass
    driver.delete_all_cookies()
    # driver.close()
    driver.quit()
    return dataResponse

def crawWhattomineCal(miningDiff, fee):
    dataResponse = {'status' : True, 'response' : []}
    try : 
        driver = chooseSeleniumOs()
    except Exception as e:
        dataResponse['status'] = False
        dataResponse['response'] = f"Error create Selenium {e}"
        return dataResponse
    try:
        miningDiff = float(miningDiff) * 10000000
        # driver.get(f"https://whattomine.com/coins/431-fb-sha-256?hr=1000.0&d_enabled=true&d={str(float(miningDiff))}&fee={str(float(fee))}")
        driver.get(f"https://whattomine.com/coins/431-fb-sha-256?hr=1000.0&d_enabled=true&d={str(float(miningDiff))}&p=0.0&fee={str(float(fee))}&cost=0.0&cost_currency=USD&hcost=0.0&span_br=&span_d=24&commit=Calculate")
        element= driver.find_elements(By.CLASS_NAME, 'font-monospace')
        rev_BTCperDaywFee = element[8].text
        dataResponse['response'] = rev_BTCperDaywFee
        element.clear()
    except Exception as e:
        dataResponse['status'] = False
        dataResponse['response'] = f"Error CrawlWhattomine {e}"
        pass
    driver.delete_all_cookies()
    driver.quit()
    return dataResponse
# print(crawlDogeChain())
# print(crawlDogeMing())
# print(crawWhattomine())
# print(crawUnisat())
# print(crawWhattomineCal('5577', '10'))
# print(crawlFractalbitcoin())
