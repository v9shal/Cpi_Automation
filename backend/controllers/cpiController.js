const CPIModel = require('../models/cpiModel');

class CPICtrl {
    static async initTable() {
        try {
          const result = await CPIModel.initTable();
          return {
            status: 'success',
            message: 'CPI table initialized successfully'
          };
        } catch (error) {
          console.error('Error in CPI controller initTable:', error);
          return {
            status: 'error',
            message: error.message
          };
        }
      }

    static async addCPI(req, res) {
        const { Roll_no, Sem_no, Year, cumulativeCPI } = req.body;
        try {
            const result = await CPIModel.addCPI(Roll_no, Sem_no, Year, cumulativeCPI);
            res.status(200).json({ message: 'CPI added/updated successfully', result });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getCPI(req, res) {
        const { Roll_no, Sem_no, Year } = req.params;
        try {
            const cpi = await CPIModel.getCPI(Roll_no, Sem_no, Year);
            if (cpi.length === 0) {
                return res.status(404).json({ message: 'CPI record not found' });
            }
            res.status(200).json(cpi);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async removeCPI(req, res) {
        const { Roll_no, Sem_no, Year } = req.body;
        try {
            const result = await CPIModel.removeCPI(Roll_no, Sem_no, Year);
            res.status(200).json({ message: 'CPI record removed successfully', result });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = CPICtrl;
