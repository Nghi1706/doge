import os
import sys
import tkinter as tk
from tkinter import Label, Entry, Button
from threading import Thread
from playsound import playsound
from crawling import crawling, crawlingSelenium


class DogecoinApp(tk.Tk):
    def __init__(self):
        super().__init__()

        # Configure main window
        self.title("Dogecoin Mining Tracker")
        self.geometry("600x400")
        self.config(background="gray20")

        # Data Variables
        self.input1Data = tk.DoubleVar(self)
        self.input2Data = tk.DoubleVar(self)
        self.input3Data = tk.DoubleVar(self)
        self.inputFees = tk.DoubleVar(self)

        self.profitability_bf = 0
        self.difficultMining = 0

        # UI Initialization
        self.create_widgets()

        # Start periodic updates
        self.after(10000, self.periodically_called)

    ## ======================== UI METHODS ======================== ##
    def create_widgets(self):
        """Create UI components and place them in the grid."""
        self.create_profitability_section()
        self.create_whattomine_section()
        self.create_unisat_section()
        self.create_mining_info_section()

    def create_profitability_section(self):
        """Creates UI elements for profitability details."""
        headers = ["Profitability", "Mining Diff", "Dogechain Diff", "Response"]
        self.profitability_labels = [Label(self, text=h, fg="white", background="gray20") for h in headers]
        for i, lbl in enumerate(self.profitability_labels):
            lbl.grid(row=0, column=i, padx=10, pady=5)

        self.profitability_data_labels = [Label(self, text="checking", fg="white", background="gray20") for _ in headers]
        for i, lbl in enumerate(self.profitability_data_labels):
            lbl.grid(row=1, column=i, padx=10, pady=5)

    def create_whattomine_section(self):
        """Creates UI elements for whattomine data."""
        Label(self, text="Rev.BTCperDay", fg="yellow", background="gray20").grid(row=2, column=0, padx=10, pady=5)
        Label(self, text="Calculating", fg="yellow", background="gray20").grid(row=2, column=1, padx=10, pady=5)
        Label(self, text="Fees", fg="yellow", background="gray20").grid(row=2, column=2, padx=10, pady=5)

        self.rev_per_day_label = Label(self, text="checking", fg="yellow", background="gray20")
        self.rev_per_day_cal_label = Label(self, text="checking", fg="yellow", background="gray20")
        self.input_Fees = Entry(self, width=10, textvariable=self.inputFees, fg="yellow", background="gray20")
        self.buttonCal = Button(self, text="Calculate", fg="white", background="black", command=self.calculate)

        self.rev_per_day_label.grid(row=3, column=0, padx=10, pady=5)
        self.rev_per_day_cal_label.grid(row=3, column=1, padx=10, pady=5)
        self.input_Fees.grid(row=3, column=2, padx=10, pady=5)
        self.buttonCal.grid(row=3, column=3, padx=10, pady=5)

    def create_unisat_section(self):
        """Creates UI elements for unisat data."""
        Label(self, text="Unisat", fg="green2", background="gray20").grid(row=7, column=0, padx=10, pady=5)

        self.unisat_labels = [Label(self, text="checking", fg="green2", background="gray20") for _ in range(5)]
        for i, lbl in enumerate(self.unisat_labels):
            lbl.grid(row=8, column=i, padx=10, pady=5)

    def create_mining_info_section(self):
        """Creates UI elements for block mining info."""
        headers = ["Block", "Time", "Transactions", "Reward", "Size"]
        self.mining_labels = [Label(self, text=h, fg="white", background="gray20") for h in headers]
        for i, lbl in enumerate(self.mining_labels):
            lbl.grid(row=9, column=i, padx=10, pady=5)

        self.mining_data_labels = [Label(self, text="checking", fg="white", background="gray20") for _ in headers]
        for i, lbl in enumerate(self.mining_data_labels):
            lbl.grid(row=10, column=i, padx=10, pady=5)

    ## ======================== BACKEND METHODS ======================== ##
    def updateUIProfit(self, profitability, difficulty, current_difficulty, responseScreen, dataBlock):
        """Updates UI for profitability."""
        labels = self.profitability_data_labels
        labels[0]["text"] = str(profitability)
        labels[1]["text"] = difficulty
        labels[2]["text"] = current_difficulty
        labels[3]["text"] = responseScreen

        self.mining_data_labels[0]["text"] = dataBlock[0]
        self.mining_data_labels[1]["text"] = f"{dataBlock[1]} ago"
        self.mining_data_labels[2]["text"] = dataBlock[2]
        self.mining_data_labels[3]["text"] = dataBlock[3]
        self.mining_data_labels[4]["text"] = dataBlock[4]

        self.playSoundChecking(self.profitability_bf, profitability)
        self.profitability_bf = profitability

    def updateUIUW(self, revPerDay, unitsat_data):
        """Updates UI for unisat data."""
        self.rev_per_day_label["text"] = str(revPerDay)
        for i, lbl in enumerate(self.unisat_labels):
            lbl["text"] = unitsat_data[i]

    def updateUIUWwithFees(self, revPerDaywithFees):
        """Updates UI for revenue calculation with fees."""
        self.rev_per_day_cal_label["text"] = str(revPerDaywithFees)
        self.buttonCal["state"] = tk.NORMAL

    def fetch_data(self):
        """Fetches mining data using crawling functions."""
        profitability, difficulty, current_difficulty, responseScreen, dataBlock = crawling()
        self.difficultMining = difficulty
        self.updateUIProfit(profitability, difficulty, current_difficulty, responseScreen, dataBlock)

    def fetch_unisat_data(self):
        """Fetches unisat data."""
        revPerDay, *unitsat_data = crawlingSelenium(0, 0, False)
        self.updateUIUW(revPerDay, unitsat_data)

    def fetch_unisat_data_with_fees(self):
        """Fetches unisat data with fees."""
        revPerDaywithFees = crawlingSelenium(self.difficultMining, self.inputFees.get(), True)
        self.updateUIUWwithFees(revPerDaywithFees)

    ## ======================== THREADING METHODS ======================== ##
    def threadingGetdataProfit(self):
        Thread(target=self.fetch_data, name="getDataProfit", daemon=True).start()

    def threadingGetdataUW(self):
        Thread(target=self.fetch_unisat_data, name="getDataUW", daemon=True).start()

    def threadingGetdataUWwithFees(self):
        Thread(target=self.fetch_unisat_data_with_fees, name="getDataUWwithFees", daemon=True).start()

    def calculate(self):
        self.threadingGetdataUWwithFees()

    def periodically_called(self):
        """Periodically refreshes data."""
        self.threadingGetdataProfit()
        self.threadingGetdataUW()
        self.after(10000, self.periodically_called)

    ## ======================== UTILITIES ======================== ##
    def get_resource_path(self, filename):
        """Gets resource path for bundled executables."""
        base_path = os.path.join(sys._MEIPASS, "Contents/Resources") if getattr(sys, "frozen", False) else os.path.abspath(".")
        return os.path.join(base_path, filename)

    def playSoundChecking(self, old_profit, new_profit):
        if old_profit != new_profit:
            audio_file = self.get_resource_path("notification.mp3")
            playsound(audio_file)


if __name__ == "__main__":
    app = DogecoinApp()
    app.mainloop()
