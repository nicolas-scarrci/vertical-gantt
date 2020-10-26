$.ganttdata = {
    tmp:{},
    core:{}
}
$.gantt = function(){
    function outline(){
        return {
            projects:{},
            resources:[],
            timeslots:[],
            assignments:{},
        }
    }
    
    //What are the gantts on this page? (so that we can have multiple)
    $('table[data-gantt-id]').each(function(){
        $.ganttdata[$(this).attr('data-gantt-id')] = outline()
        $.ganttdata[$(this).attr('data-gantt-id')].references = outline()

        // adding temporary variable storage
        $.ganttdata[$(this).attr('data-gantt-id')].tmp = {}
    })
    var processProject
    //Process the projects tables
    $('table[data-gantt-role="projects"]').each(function (){
        
        $('thead tr',this).append('<th>Slots Remaining</th>')
        processProject = function (){
            var id = $(this).closest('table').attr('data-gantt-id')
            $(this).append("<td>0</td>")
            data = $('td',this)
            var projectid = $(data[0]).text()
            $.ganttdata[id].projects[projectid] = {
                color:                  $(data[1]).text(),
                customer:               $(data[2]).text(),
                estimate:      parseInt($(data[3]).text()),
                deadline:               $(data[4]).text(),
                slotsAllotted: parseInt($(data[5]).text()),       
            }
            $.ganttdata[id].references.projects[projectid] = {
                project:             $(data[0]),
                color:               $(data[1]),
                customer:            $(data[2]),
                estimate:            $(data[3]),
                deadline:            $(data[4]),
                slotsAllotted:       $(data[5]) 
            }
            $('td:first-child',this).click({id},selectProject).attr('data-gantt-projectid',$(data[0]).text())
            
            var types = ["text","color","text","text","text"]
            var projectTitleChanged = function(e){
                $(`table[data-gantt-role="gantt"][data-gantt-id="${id}"] td[data-gantt-projectid="${projectid}"]`).text($(this).val())
            }
            var projectColorChanged = function(){
                $.ganttdata[id].projects[projectid].color = $(this).val()
                $(`table[data-gantt-role="gantt"][data-gantt-id="${id}"] td[data-gantt-projectid="${projectid}"]`).css('background-color',$(this).val())
            }
            var deadlineChanged = function(){
                $.ganttdata[id].projects[projectid].deadline = $(this).val()
                $(`table[data-gantt-role="gantt"][data-gantt-id="${id}"]`).each($.ganttdata.core.checkDeadlines)
            }
            var estimateChanged = function(){
                $.ganttdata[id].projects[projectid].estimate = $(this).val()
                updateSlotsRemaining(id)

            }
            var onchange = [projectTitleChanged,projectColorChanged,undefined,estimateChanged,deadlineChanged]
            
            for(i in [0,1,2,3,4]){
                var cell = $(data[i])
                var text = cell.text()
                cell.html(`<input type="${types[i]}" value="${text}">`)
                if(onchange[i]!==undefined){
                    $('input',cell).change(onchange[i])
                }
            }
        }
        $('tbody tr',this).each(processProject)
    })
    
    var processResource
    var processTimeslot
    var processAssignment
    

    //Process the actual gantt tables
    $('table[data-gantt-role="gantt"]').each(function(){
        
        //parse the resources
        processResource = function(){
            var id = $(this).closest('table').attr('data-gantt-id')
            var resource = $(this).text()
            $.ganttdata[id].resources.push(resource)
            $(this).html(`<input type="text" value="${resource}">`)
                   .attr('data-gantt-resourceid',resource)
        }
        $('th',$('thead tr',this)[0]).slice(1).each(processResource)
        
        //parse the timeslots
        processTimeslot = function(){
            var id = $(this).closest('table').attr('data-gantt-id')
            var timeslot = $(this).text()
            $.ganttdata[id].timeslots.push(timeslot)
            $(this).html(`<input type="text" value="${timeslot}">`)
                   .attr('data-gantt-timeslotid',timeslot)
        }
        $('tbody tr td:first-child',this).each(processTimeslot)
        
        $.ganttdata.core.checkDeadlines = function(){
            $('table[data-gantt-role="gantt"] .deadline,table[data-gantt-role="gantt"] .deadline-before,table[data-gantt-role="gantt"] .deadline-after')
                .removeClass('deadline')
                .removeClass('deadline-before')
                .removeClass('deadline-after')
            var id = $(this).attr('data-gantt-id')
            for(var projectKey in $.ganttdata[id].projects){
                var deadline = $.ganttdata[id].projects[projectKey].deadline
                /*for(var timeslotKey in $.ganttdata[id].references.timeslots){
                    var timeslotCell = $.ganttdata[id].references.timeslots[timeslotKey]
                    var timeslot = $('input',timeslotCell).val()*/
                var timeslots = $('tbody tr td:first-child',this)
                if(deadline.toLowerCase().startsWith('end of')){
                    var lastTime 
                    timeslots.each(function(index,timeslot){
                        if($('input',timeslot).val().toLowerCase().includes(deadline.toLowerCase().replace('end of','').trim())){
                            lastTime = index
                        }
                    })
                    if(lastTime!==undefined){
                        $($('tbody tr td:first-child',this)[lastTime]).closest('tr').addClass('deadline').addClass('deadline-after').css('border-color',$.ganttdata[id].projects[projectKey].color)
                    }
                }
                else if(deadline.toLowerCase().startsWith('start of')){
                    var firstTime 
                    timeslots.each(function(index,timeslot){
                        if($('input',timeslot).val().toLowerCase().includes(deadline.toLowerCase().replace('start of','').trim())&&firstTime===undefined){
                            firstTime = index
                        }
                    })
                    if(firstTime!==undefined){
                        $($('tbody tr td:first-child',this)[firstTime]).closest('tr').addClass('deadline').addClass('deadline-before').css('border-color',$.ganttdata[id].projects[projectKey].color)
                    }
                }
                else {
                    var firstTime 
                    timeslots.each(function(index,timeslot){
                        if($('input',timeslot).val().toLowerCase().includes(deadline.toLowerCase().trim())&&firstTime===undefined){
                            firstTime = index
                        }
                    })
                    if(firstTime!==undefined){
                        $($('tbody tr td:first-child',this)[firstTime]).closest('tr').addClass('deadline').addClass('deadline-before').css('border-color',$.ganttdata[id].projects[projectKey].color)
                    }
                }
            
            }
        }
        $(this).each($.ganttdata.core.checkDeadlines)

        //Parse the current assignments
        processAssignment = function(){
            var id = $(this).closest('table').attr('data-gantt-id')
            var resource = $.ganttdata[id].resources[$(this).prevAll('td').length-1]
            var timeslot = $('td:first-child input',$(this).closest('tr')).val()
            var project = $(this).text()

            if($.ganttdata[id].assignments[timeslot]==undefined){
                $.ganttdata[id].assignments[timeslot]={}
            }
            
            if($.ganttdata[id].projects[project]!=undefined){
                $(this).css('background-color',$.ganttdata[id].projects[project].color).attr('data-gantt-projectid',project)
            }

            $.ganttdata[id].assignments[timeslot][resource]=project
            if($.ganttdata[id].projects[project]!=undefined){
                $.ganttdata[id].projects[project].slotsAllotted++
            }
            $(this).click({timeslot,resource,id},toggleAssignment)
        }
        $('tbody tr td:not(:first-child)',this).each(processAssignment)

        //Output slots remaining
        $('table[data-gantt-role="projects"]').each(function (){
            var id = $(this).attr('data-gantt-id')
            updateSlotsRemaining(id)
        })
    })



    function updateSlotsRemaining(id){
        for(var projectKey in $.ganttdata[id].projects){
            var project = $.ganttdata[id].projects[projectKey]
            var ref = $.ganttdata[id].references.projects[projectKey].slotsAllotted
            var slotsRemaining = project.estimate - project.slotsAllotted

            ref.text(slotsRemaining)
            ref.toggleClass('slotFeedback',slotsRemaining!=0)
        }
    }

    function selectProject(e){
        $('table[data-gantt-role="projects"][data-gantt-id="'+e.data.id+'"] td').removeClass('selectedProject')
        if($.ganttdata[e.data.id].tmp.selectedproject == $(this).attr('data-gantt-projectid')){
            $.ganttdata[e.data.id].tmp.selectedproject = undefined
        }
        else{
            $.ganttdata[e.data.id].tmp.selectedproject = $(this).attr('data-gantt-projectid')
            $(this).addClass('selectedProject')
        }
        
        
    }

    function toggleAssignment(eventdata){
        var timeslot = eventdata.data.timeslot
        var resource = eventdata.data.resource
        var id = eventdata.data.id

        //is a project selected? If not get out of here!
        if($.ganttdata[id].tmp.selectedproject == undefined){
            return
        }

        var table = $(this).closest('table[data-gantt-id]')
        var id = table.attr('data-gantt-id')
        
        var currentProject = $.ganttdata[id].assignments[timeslot][resource]
        var selectedProject = $.ganttdata[id].tmp.selectedproject
  
        if(currentProject == selectedProject){
            $(this).text('')
                   .css('background-color','')
                   .attr('data-gantt-projectid','')
            $.ganttdata[id].assignments[timeslot][resource] = '';
            $.ganttdata[id].projects[selectedProject].slotsAllotted--
        }
        else{
            $(this).text($('input',$.ganttdata[id].references.projects[selectedProject].project).val())//since the value may have changed
                   .css('background-color', $.ganttdata[id].projects[selectedProject].color)
                   .attr('data-gantt-projectid',selectedProject)
            $.ganttdata[id].assignments[timeslot][resource] = selectedProject
            if($.ganttdata[id].projects[currentProject]!=undefined){
                $.ganttdata[id].projects[currentProject].slotsAllotted--
            }
            $.ganttdata[id].projects[selectedProject].slotsAllotted++
        }
        updateSlotsRemaining(id)
    }

    //Additional buttons and controls
    //add project button
    function addNewProjectButton(id){
        $(`table[data-gantt-role="projects"]${id===undefined?``:`[data-gantt-id="${id}"]`} tbody`).append(
            $('<tr class="button-only"><td><button>+</button></td></tr>').click(function(){
                var table = $(this).closest("table")
                $(this).remove()
                var randomcolor = '#'+(''+Math.floor(Math.random()*255).toString(16)).padStart(2,'0')+(''+Math.floor(Math.random()*255).toString(16)).padStart(2,'0')+(''+Math.floor(Math.random()*255).toString(16)).padStart(2,'0')
                var uniqueprojectname = 'Project ' + Math.floor(Math.random()*1000+999)
                
                $("tbody",table).append(`<tr><td>${uniqueprojectname}</td><td>${randomcolor}</td>${'<td>'.repeat(3)}</tr>`)

                $('tbody tr:last-child',table).each(processProject)
                addNewProjectButton(table.attr('data-gantt-id'))
            })
        )
    }addNewProjectButton()
    
    function addNewResourceButton(id){
        $(`table[data-gantt-role="gantt"]${id===undefined?``:`[data-gantt-id="${id}"]`} thead tr:last-child`).append(
            $('<th class="button-only"><button>+</button><input type="text"></th>').click(function(){
                var table = $(this).closest("table")
                $(this).remove()
                var resource = 'Team ' + Math.floor(Math.random()*1000+999)

                $("thead tr",table).append(`'<th>${resource}</th>`)
                $("tbody tr",table).append(`'<td>`)

                $('th:last-child',$('thead tr',table)).each(processResource)
                $('tbody tr td:last-child',table).each(processAssignment)
                
                addNewResourceButton(table.attr('data-gantt-id'))        
            })
        )
    }addNewResourceButton()

    function addNewTimeslotButton(id){
        $(`table[data-gantt-role="gantt"]${id===undefined?``:`[data-gantt-id="${id}"]`}`).append(
            $('<tr class="button-only"><td><button>+</button></td></tr>').click(function(){
                var table = $(this).closest("table")
                $(this).remove()
                var timeslot = 'Week ' + Math.floor(Math.random()*1000+999)

                var tr = $('<tr>')
                tr.append(`<td>${timeslot}</td>`)
                tr.append('<td>'.repeat($('td',$('tr:first-child',table)).length-1))
                $("tbody",table).append(tr)

                $('tbody tr:last-child td:first-child',table).each(processTimeslot)
                $('tbody tr:last-child td:not(:first-child)',table).each(processAssignment)

                //$(this).remove()
                addNewTimeslotButton(table.attr('data-gantt-id'))
            })
        )
    }addNewTimeslotButton()
}
$(function() {
    $.gantt()
})