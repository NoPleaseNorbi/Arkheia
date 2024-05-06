const mongoose = require('mongoose');
const ParameterSearch = require('../models/parameter_search_model');
const Simulation = require('../models/simulation_run_model');
const Stimulus = require('../models/stimuli_model');
const ExpProtocol = require('../models/exp_protocol_model');
const Record = require('../models/records_model');
const Result = require('../models/results_model');

// Get all parameter searches
const getParameterSearches = async (req, res) => {
  const parameter_searches = await ParameterSearch.find({}).sort({createdAt: -1})

  res.status(200).json(parameter_searches)
};

// Create a parameter search
const createParameterSearch = async (req, res) => {
  const {name, model_name, run_date, simulationIds, parameter_combinations } = req.body
    //add to db
    try {
      const simulations = await Simulation.find({ _id: { $in: simulationIds }});
      const parameter_search = await ParameterSearch.create({
        name,
        model_name, 
        run_date, 
        simulations: simulations.map(simulation => simulation._id),
        parameter_combinations
      })
      res.status(200).json(parameter_search)
    } catch (error) {
      res.status(400).json({error: error.message})
    }
};

// Update a parameter search
const updateParameterSearch = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'Bad format of ID' });
  }

  const parameter_search = await ParameterSearch.findByIdAndUpdate(id, {
    ...req.body // Fields to update from request body
  }, { new: true }); // Option to return the updated document

  if (!parameter_search) {
    return res.status(400).json({ error: 'No such parameter search' });
  }

  res.status(200).json(parameter_search);
}

// Delete a parameter search
const deleteParameterSearch = async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({error: 'Bad format of ID'});
  }

  const parameter_search = await ParameterSearch.findOne({ _id : id }).populate('simulations');

  if (!parameter_search) {
    return res.status(400).json({error: 'No such parameter search'});
  }

  // Delete all simulations and their associated data
  for (const simulation of parameter_search.simulations) {

    await Stimulus.deleteMany({ '_id': { $in: simulation.stimuli } });
    await ExpProtocol.deleteMany({ '_id': { $in: simulation.exp_protocols } });
    await Record.deleteMany({ '_id': { $in: simulation.records } });
    await Result.deleteMany({ '_id': { $in: simulation.results } });

    // Delete the simulation itself
    await Simulation.deleteOne({ '_id': simulation._id });
  }

  await ParameterSearch.deleteOne({ _id : id });

  res.status(200).json({ message: 'Parameter search and all associated simulations deleted successfully' });
};


// Get a parameter search by ID
const getParameterSearch = async (req, res) => {
  const { id } = req.params
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({error: 'Bad format of ID'})
  }

  const parameter_search = await ParameterSearch.findOne({ _id : id})

  if (!parameter_search) {
      return res.status(400).json({error: 'No such simulation'})
  }

  res.status(200).json(parameter_search)
}

// Get all the simulations associated with a parameter search
const getParameterSearchSimulations = async (req, res) => {
  const parameterSearchId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(parameterSearchId)) {
    return res.status(404).json({error: 'Bad format of ID'})
  }
  try {
    const parameter_search = await ParameterSearch.findById(parameterSearchId);
    
    if (!parameter_search) {
      return res.status(400).json({ error: 'Parameter search not found' });
    }
    
    const simulations = await Simulation.find({ _id: { $in: parameter_search.simulations } });
    
    res.status(200).json(simulations);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

// Get all the results associated with simulations which are associated with a parameter search
const getParameterSearchResults = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({error: 'Bad format of ID'})
    }
    const parameter_search = await ParameterSearch.findById(req.params.id).populate('simulations');
    if (!parameter_search) {
      return res.status(400).json({ message: 'Parameter search not found' });
    }

    const simulations = await Simulation.find({ '_id': { $in: parameter_search.simulations } }).populate('results');
    const results = simulations.map(simulation => simulation.results);

    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}



module.exports = {
  getParameterSearches,
  createParameterSearch,
  deleteParameterSearch,
  getParameterSearch,
  getParameterSearchSimulations,
  getParameterSearchResults,
  updateParameterSearch
};
