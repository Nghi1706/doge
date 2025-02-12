# lib request
import requests
from bs4 import BeautifulSoup
from datetime import datetime,timezone
# lib selenium
    
from selenium import webdriver
# from selenium.webdriver.common.keys import Keys
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
import time


def crawling():
    # code
    dt = datetime.now(timezone.utc).replace(tzinfo=None)
    timeStamp = int(datetime.timestamp(dt))
    resMini = requests.get('https://www.mining-dutch.nl/pools/dogecoin.php?page=api&action=getdashboarddata&api_key=&id=&_=' + str(timeStamp))
    reschain = requests.get('https://dogechain.info/')
    html_content = reschain.text
    soup = BeautifulSoup(html_content, "html.parser")
    profitability = int(round(float(resMini.json()['getdashboarddata']['data']['pool']['price']) * 100000000))
    difficulty = int(resMini.json()['getdashboarddata']['data']['network']['difficulty'][0:4])
    current_difficulty = int(soup.find('h3',{'id':'block_difficulty'}).get_text().replace(',','')[0:4])
    responseScreen = 'Sai khối'
    if difficulty != current_difficulty :
        responseScreen = ''
    block = soup.find_all('tr')
    blockinfor =  block[1].find_all('td')
    blockNumber = blockinfor[0].get_text()
    blockTime = str(dt - datetime.strptime(blockinfor[1].find('abbr').get('title'), '%Y-%m-%dT%H:%M:%SZ'))[:7]
    blockTransactions = blockinfor[2].get_text()
    blockReward = blockinfor[3].get_text()
    blockSize = blockinfor[4].get_text()
    dataBlock = [blockNumber, blockTime, blockTransactions,blockReward,blockSize]
    return [profitability,difficulty,current_difficulty,responseScreen, dataBlock]



def crawlingSelenium(miningDiff, fee, isCalculating):
    # setup firefox selenium
    options = Options()
    options.add_argument('--private')
    options.add_argument('--headless')
    miningDiff = miningDiff * 10000000
    driver = webdriver.Firefox(executable_path=r'./geckodriver.exe', options=options)
    # crawling data
    # what to mine
    if isCalculating is False:
        driver.get("https://whattomine.com/coins/431-fb-sha-256?hr=1000.0")
        element= driver.find_elements(By.CLASS_NAME, 'font-monospace')
        rev_BTCperDay = element[8].text
        element.clear()
        # unisat
        driver.get("https://fractal.unisat.io/explorer/block/ef9dc9d5ba31f410d67f1be2f6419c21cbfe17746b4bca08b283fd412eb26485")
        time.sleep(0.5)
        element= driver.find_elements(By.CLASS_NAME, 'not-confirmed-block-div-right-confirmed')
        firstBlock = element[0]
        firstBlockName1 =  firstBlock.find_element(By.CLASS_NAME, 'font12').text
        firstBlockName2 = firstBlock.find_element(By.CLASS_NAME, 'text-FFEC9F').text
        firstBlockName3 = firstBlock.find_element(By.CLASS_NAME, 'font16').text .replace('\n', ' ')
        firstBlockTransaction = firstBlock.find_element(By.CLASS_NAME, 'font10').text
        firstBlockTime = firstBlock.find_element(By.CLASS_NAME, 'font11').text 
        element.clear()
        driver.delete_all_cookies()
        # driver.close()
        driver.quit()
        return [rev_BTCperDay, firstBlockName1, firstBlockName2, firstBlockName3, firstBlockTransaction, firstBlockTime]
    else:
        # calculating data
        driver.get("https://whattomine.com/coins/431-fb-sha-256?hr=1000.0&d=" + str(miningDiff) + '&fee=' + str(fee))
        element= driver.find_elements(By.CLASS_NAME, 'font-monospace')
        rev_BTCperDaywFee = element[8].text
        element.clear()
        driver.delete_all_cookies()
        # driver.close()
        driver.quit()
        return rev_BTCperDaywFee


# crawlingSelenium(1234, 5342, False)
def crawlDogeMing():
    dt = datetime.now(timezone.utc).replace(tzinfo=None)
    timeStamp = int(datetime.timestamp(dt))
    resMini = requests.get('https://www.mining-dutch.nl/pools/dogecoin.php?page=api&action=getdashboarddata&api_key=&id=&_=' + str(timeStamp))
    profitability = int(round(float(resMini.json()['getdashboarddata']['data']['pool']['price']) * 100000000))
    difficulty_mining = int(resMini.json()['getdashboarddata']['data']['network']['difficulty'][0:4])
    response = ''
    return [profitability,difficulty_mining, response]
def crawlFractalbitcoin():
    dt = datetime.now(timezone.utc).replace(tzinfo=None)
    timeStamp = int(datetime.timestamp(dt))
    resMini = requests.get('https://www.mining-dutch.nl/pools/fractalbitcoin.php?page=api&action=getdashboarddata&api_key=&id=&_=' + str(timeStamp))
    difficulty_frata = round(int(resMini.json()['getdashboarddata']['data']['network']['difficulty']) / 10000000)
    return difficulty_frata
def crawlDogeChain():
    dt = datetime.now(timezone.utc).replace(tzinfo=None)
    reschain = requests.get('https://dogechain.info/')
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
    return [difficulty_DogeChain, dataBlock]

def crawWhattomine():
    # try:

    # setup firefox site
    options = Options()
    options.add_argument('--private')
    options.add_argument('--headless')
    # driver = webdriver.Firefox(options=options)
    driver = webdriver.Firefox(executable_path=r'./geckodriver.exe', options=options)
    driver.get("https://whattomine.com/coins/431-fb-sha-256?hr=1000.0")
    element= driver.find_elements(By.CLASS_NAME, 'font-monospace')
    rev_BTCperDay = element[8].text
    element.clear()
    driver.delete_all_cookies()
    # driver.close()
    driver.quit()
    # except Exception as error:
    #     print(error)
    return rev_BTCperDay

def crawUnisat():
    options = Options()
    options.add_argument('--private')
    options.add_argument('--headless')
    # driver = webdriver.Firefox(options=options)
    driver = webdriver.Firefox(executable_path=r'./geckodriver.exe', options=options)
    driver.get("https://fractal.unisat.io/explorer/block/ef9dc9d5ba31f410d67f1be2f6419c21cbfe17746b4bca08b283fd412eb26485")
    time.sleep(0.5)
    element= driver.find_elements(By.CLASS_NAME, 'not-confirmed-block-div-right-confirmed')
    firstBlock = element[0]
    firstBlockName1 =  firstBlock.find_element(By.CLASS_NAME, 'font12').text
    firstBlockName2 = firstBlock.find_element(By.CLASS_NAME, 'text-FFEC9F').text
    firstBlockName3 = firstBlock.find_element(By.CLASS_NAME, 'font16').text .replace('\n', ' ')
    firstBlockTransaction = firstBlock.find_element(By.CLASS_NAME, 'font10').text
    firstBlockTime = firstBlock.find_element(By.CLASS_NAME, 'font11').text 
    element.clear()
    driver.delete_all_cookies()
    # driver.close()
    driver.quit()
    return [firstBlockName1, firstBlockName2, firstBlockName3, firstBlockTransaction, firstBlockTime]

def crawWhattomineCal(miningDiff, fee):
    if isinstance(float(miningDiff), float) and isinstance(float(fee), float):
        miningDiff = float(miningDiff) * 10000000
        options = Options()
        options.add_argument('--private')
        options.add_argument('--headless')
        # driver = webdriver.Firefox(options=options)
        driver = webdriver.Firefox(executable_path=r'./geckodriver.exe', options=options)
        driver.get(f"https://whattomine.com/coins/431-fb-sha-256?hr=1000.0&d_enabled=true&d={str(float(miningDiff))}&fee={str(float(fee))}")
        element= driver.find_elements(By.CLASS_NAME, 'font-monospace')
        rev_BTCperDaywFee = element[8].text
        element.clear()
        driver.delete_all_cookies()
        # driver.close()
        driver.quit()
    else:
        rev_BTCperDaywFee = 'Error Input'
    return rev_BTCperDaywFee
# print(crawlDogeChain())
# print(crawlDogeMing())
# print(crawWhattomine())
# print(crawUnisat())
# crawWhattomineCal('5577', '10')
# crawlFractalbitcoin()